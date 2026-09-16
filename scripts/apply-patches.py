#!/usr/bin/env python3
"""
Aurora Theme — surgical patch engine.

Applies (or removes) small, clearly-marked insertions into existing Pterodactyl
core files. Every insertion is wrapped in BEGIN/END markers so installs are
idempotent and uninstalls can cleanly reverse them.

Anchors below were verified against Pterodactyl Panel 1.14.x and 1.15.x. If an anchor is
not found the script exits non-zero with a precise error instead of guessing.

Usage:
    apply-patches.py --panel-dir /var/www/pterodactyl --action apply|remove|check
"""

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Patch:
    key: str
    rel_path: str
    description: str
    # For "insert_before": text is inserted before the first line containing the anchor.
    # For "append": text is appended to the end of the file.
    # For "replace_line": the first line containing the anchor is replaced with text.
    mode: str
    anchor: str
    begin_marker: str
    end_marker: str
    block: str
    # For "append" patches: also remove the blank separator line that apply()
    # inserts before the block, so removal restores the file byte-identically.
    trim_preceding_blank: bool = False
    # For "replace_line" patches whose replacement keeps a modified copy of the
    # original line outside the markers: substring identifying that modified
    # line plus the exact original text to restore on removal.
    restore_anchor: str = ""
    restore_text: str = ""


AURORA_ROUTES_BLOCK = """// === AURORA THEME ROUTES BEGIN ===
Route::middleware('web')->group(base_path('routes/aurora.php'));
// === AURORA THEME ROUTES END ==="""

ADMIN_ROUTES_BLOCK = """// === AURORA THEME ADMIN ROUTES BEGIN ===
Route::group(['prefix' => 'aurora-theme'], function () {
    Route::get('/', [\\Pterodactyl\\Http\\Controllers\\Admin\\AuroraThemeController::class, 'index'])
        ->name('admin.aurora-theme');
    Route::patch('/', [\\Pterodactyl\\Http\\Controllers\\Admin\\AuroraThemeController::class, 'update'])
        ->name('admin.aurora-theme.update');
    Route::post('/preset/{preset}', [\\Pterodactyl\\Http\\Controllers\\Admin\\AuroraThemeController::class, 'applyPreset'])
        ->name('admin.aurora-theme.preset');
    Route::post('/reset', [\\Pterodactyl\\Http\\Controllers\\Admin\\AuroraThemeController::class, 'reset'])
        ->name('admin.aurora-theme.reset');
    Route::post('/upload', [\\Pterodactyl\\Http\\Controllers\\Admin\\AuroraThemeController::class, 'upload'])
        ->name('admin.aurora-theme.upload');
    Route::get('/export', [\\Pterodactyl\\Http\\Controllers\\Admin\\AuroraThemeController::class, 'export'])
        ->name('admin.aurora-theme.export');
    Route::post('/import', [\\Pterodactyl\\Http\\Controllers\\Admin\\AuroraThemeController::class, 'import'])
        ->name('admin.aurora-theme.import');
});
// === AURORA THEME ADMIN ROUTES END ==="""

APP_TSX_IMPORT_ANCHOR = "import Spinner from '@/components/elements/Spinner';"
APP_TSX_IMPORT_BLOCK = """import Spinner from '@/components/elements/Spinner';
// === AURORA THEME IMPORTS BEGIN ===
import { AuroraThemeProvider } from '@/aurora/ThemeContext';
import '@/aurora/aurora.css';
// === AURORA THEME IMPORTS END ==="""

APP_TSX_OPEN = "<StoreProvider store={store}>"
APP_TSX_CLOSE = "</StoreProvider>"

BASE_CONTROLLER_ANCHOR = "return view('admin.index', ['version' => $this->version]);"
BASE_CONTROLLER_BLOCK = """// === AURORA THEME STATS BEGIN ===
        $auroraStats = \\Pterodactyl\\Services\\AuroraThemeService::dashboardStats();
        // === AURORA THEME STATS END ===
        return view('admin.index', ['version' => $this->version, 'auroraStats' => $auroraStats]);"""


def remove_marked_block(
    text: str, begin_marker: str, end_marker: str, trim_preceding_blank: bool = False
):
    """Remove all blocks delimited by full-line begin/end markers."""
    out = []
    skipping = False
    removed = False
    for line in text.splitlines(keepends=True):
        stripped = line.rstrip("\n").strip()
        if stripped == begin_marker.strip():
            if trim_preceding_blank and out and out[-1].strip() == "":
                out.pop()
            skipping = True
            removed = True
            continue
        if stripped == end_marker.strip():
            skipping = False
            continue
        if not skipping:
            out.append(line)
    # Collapse 3+ blank lines left behind into max two.
    result = "".join(out)
    while "\n\n\n\n" in result:
        result = result.replace("\n\n\n\n", "\n\n\n")
    return result, removed


def apply_patch(panel_dir: Path, patch: Patch) -> str:
    target = panel_dir / patch.rel_path
    if not target.is_file():
        return f"{MISSING}: {patch.rel_path} does not exist"

    text = target.read_text(encoding="utf-8")

    # Idempotency: already applied.
    if patch.begin_marker.strip() in text:
        return "already-applied"

    if patch.mode == "append":
        if not text.endswith("\n"):
            text += "\n"
        text += "\n" + patch.block + "\n"
        target.write_text(text, encoding="utf-8")
        return "applied"

    if patch.mode == "insert_before":
        lines = text.splitlines(keepends=True)
        for i, line in enumerate(lines):
            if patch.anchor in line:
                indent = line[: len(line) - len(line.lstrip())]
                block = "\n".join(
                    (indent + l) if l.strip() else l for l in patch.block.splitlines()
                )
                lines.insert(i, block + "\n")
                target.write_text("".join(lines), encoding="utf-8")
                return "applied"
        return f"ANCHOR-NOT-FOUND: {patch.anchor!r} in {patch.rel_path}"

    if patch.mode == "replace_line":
        lines = text.splitlines(keepends=True)
        for i, line in enumerate(lines):
            if patch.anchor in line:
                indent = line[: len(line) - len(line.lstrip())]
                block_lines = patch.block.splitlines()
                rebuilt = []
                for j, bl in enumerate(block_lines):
                    if j == 0:
                        rebuilt.append(indent + bl.lstrip() + "\n")
                    else:
                        rebuilt.append((indent + bl.lstrip() if bl.strip() else "") + "\n")
                lines[i : i + 1] = rebuilt
                target.write_text("".join(lines), encoding="utf-8")
                return "applied"
        return f"ANCHOR-NOT-FOUND: {patch.anchor!r} in {patch.rel_path}"

    return f"UNKNOWN-MODE: {patch.mode}"


def apply_app_tsx_provider(panel_dir: Path, action: str) -> str:
    """Special-case patch: wrap StoreProvider children with AuroraThemeProvider."""
    target = panel_dir / "resources/scripts/components/App.tsx"
    if not target.is_file():
        return "MISSING: resources/scripts/components/App.tsx does not exist"
    text = target.read_text(encoding="utf-8")

    if action == "remove":
        new_text = text.replace("            <AuroraThemeProvider>\n", "")
        new_text = new_text.replace("            </AuroraThemeProvider>\n", "")
        if new_text != text:
            target.write_text(new_text, encoding="utf-8")
            return "removed"
        return "not-present"

    if "AuroraThemeProvider" in text and "<AuroraThemeProvider>" in text:
        return "already-applied"
    if APP_TSX_OPEN not in text or APP_TSX_CLOSE not in text:
        return "ANCHOR-NOT-FOUND: StoreProvider tags in App.tsx"
    new_text = text.replace(
        "            <StoreProvider store={store}>\n",
        "            <StoreProvider store={store}>\n            <AuroraThemeProvider>\n",
        1,
    )
    new_text = new_text.replace(
        "            </StoreProvider>\n",
        "            </AuroraThemeProvider>\n            </StoreProvider>\n",
        1,
    )
    if new_text == text:
        return "ANCHOR-NOT-FOUND: StoreProvider tags (indented) in App.tsx"
    target.write_text(new_text, encoding="utf-8")
    return "applied"


PATCHES = [
    Patch(
        key="route-service-provider",
        rel_path="app/Providers/RouteServiceProvider.php",
        description="Register routes/aurora.php (public theme config endpoint)",
        mode="insert_before",
        anchor="Route::middleware('daemon')",
        begin_marker="// === AURORA THEME ROUTES BEGIN ===",
        end_marker="// === AURORA THEME ROUTES END ===",
        block=AURORA_ROUTES_BLOCK,
    ),
    Patch(
        key="admin-routes",
        rel_path="routes/admin.php",
        description="Register /admin/aurora-theme settings routes",
        mode="append",
        anchor="",
        begin_marker="// === AURORA THEME ADMIN ROUTES BEGIN ===",
        end_marker="// === AURORA THEME ADMIN ROUTES END ===",
        block=ADMIN_ROUTES_BLOCK,
        trim_preceding_blank=True,
    ),
    Patch(
        key="app-tsx-imports",
        rel_path="resources/scripts/components/App.tsx",
        description="Import AuroraThemeProvider + aurora.css in App.tsx",
        mode="replace_line",
        anchor=APP_TSX_IMPORT_ANCHOR,
        begin_marker="// === AURORA THEME IMPORTS BEGIN ===",
        end_marker="// === AURORA THEME IMPORTS END ===",
        block=APP_TSX_IMPORT_BLOCK,
    ),
    Patch(
        key="admin-base-controller",
        rel_path="app/Http/Controllers/Admin/BaseController.php",
        description="Pass real dashboard stats to the admin overview",
        mode="replace_line",
        anchor=BASE_CONTROLLER_ANCHOR,
        begin_marker="// === AURORA THEME STATS BEGIN ===",
        end_marker="// === AURORA THEME STATS END ===",
        block=BASE_CONTROLLER_BLOCK,
        restore_anchor="'auroraStats' => $auroraStats",
        restore_text="return view('admin.index', ['version' => $this->version]);",
    ),
]


def remove_patch(panel_dir: Path, patch: Patch) -> str:
    target = panel_dir / patch.rel_path
    if not target.is_file():
        return "missing-file-skipped"
    text = target.read_text(encoding="utf-8")
    new_text, removed = remove_marked_block(text, patch.begin_marker, patch.end_marker, patch.trim_preceding_blank)
    if patch.restore_anchor and patch.restore_text:
        lines = new_text.splitlines(keepends=True)
        for i, line in enumerate(lines):
            if patch.restore_anchor in line:
                indent = line[: len(line) - len(line.lstrip())]
                lines[i] = indent + patch.restore_text.lstrip() + "\n"
                new_text = "".join(lines)
                removed = True
                break
    if removed:
        target.write_text(new_text, encoding="utf-8")
        return "removed"
    return "not-present"


def main() -> int:
    parser = argparse.ArgumentParser(description="Aurora theme patch engine")
    parser.add_argument("--panel-dir", required=True)
    parser.add_argument("--action", required=True, choices=["apply", "remove", "check"])
    args = parser.parse_args()

    panel_dir = Path(args.panel_dir)
    if not panel_dir.is_dir():
        print(f"[ERROR] Panel directory does not exist: {panel_dir}")
        return 1

    failures = 0

    if args.action == "check":
        for patch in PATCHES:
            target = panel_dir / patch.rel_path
            if not target.is_file():
                print(f"[CHECK] {patch.key}: MISSING FILE {patch.rel_path}")
                failures += 1
                continue
            text = target.read_text(encoding="utf-8")
            if patch.begin_marker.strip() in text:
                print(f"[CHECK] {patch.key}: already applied")
            elif patch.mode == "append" or patch.anchor in text:
                print(f"[CHECK] {patch.key}: anchor OK")
            else:
                print(f"[CHECK] {patch.key}: ANCHOR NOT FOUND ({patch.anchor!r})")
                failures += 1
        # App.tsx provider check
        app_tsx = panel_dir / "resources/scripts/components/App.tsx"
        if app_tsx.is_file():
            t = app_tsx.read_text(encoding="utf-8")
            if "<AuroraThemeProvider>" in t:
                print("[CHECK] app-tsx-provider: already applied")
            elif APP_TSX_OPEN in t and APP_TSX_CLOSE in t:
                print("[CHECK] app-tsx-provider: anchor OK")
            else:
                print("[CHECK] app-tsx-provider: ANCHOR NOT FOUND")
                failures += 1
        return 1 if failures else 0

    if args.action == "apply":
        for patch in PATCHES:
            result = apply_patch(panel_dir, patch)
            print(f"[PATCH] {patch.key}: {result}")
            if result.startswith(("MISSING", "ANCHOR-NOT-FOUND", "UNKNOWN-MODE")):
                failures += 1
        result = apply_app_tsx_provider(panel_dir, "apply")
        print(f"[PATCH] app-tsx-provider: {result}")
        if result.startswith(("MISSING", "ANCHOR-NOT-FOUND")):
            failures += 1
        return 1 if failures else 0

    if args.action == "remove":
        for patch in PATCHES:
            result = remove_patch(panel_dir, patch)
            print(f"[PATCH] {patch.key}: {result}")
        result = apply_app_tsx_provider(panel_dir, "remove")
        print(f"[PATCH] app-tsx-provider: {result}")
        return 0

    return 1


if __name__ == "__main__":
    sys.exit(main())
