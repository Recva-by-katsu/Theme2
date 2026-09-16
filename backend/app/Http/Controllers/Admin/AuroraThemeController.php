<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\AuroraThemeService;
use Pterodactyl\Http\Requests\Admin\AuroraThemeRequest;

/**
 * Admin → Theme Settings (Aurora).
 *
 * Every action here actually persists through AuroraThemeService and takes
 * effect immediately (config is injected into every page + served as JSON).
 */
class AuroraThemeController extends Controller
{
    public function __construct(
        private AlertsMessageBag $alert,
        private AuroraThemeService $themes,
    ) {
    }

    /**
     * Render the theme settings UI.
     */
    public function index(): View
    {
        return view('admin.aurora-theme.index', [
            'config' => $this->themes->get(),
            'defaults' => AuroraThemeService::defaults(),
            'presets' => AuroraThemeService::presets(),
            'themeVersion' => AuroraThemeService::VERSION,
        ]);
    }

    /**
     * Persist the full theme configuration.
     */
    public function update(AuroraThemeRequest $request): RedirectResponse
    {
        $this->themes->save($request->normalized());

        $this->alert->success('Theme settings have been saved and are now live across the panel.')->flash();

        return redirect()->route('admin.aurora-theme');
    }

    /**
     * Apply one of the built-in presets (becomes a real, editable config).
     */
    public function applyPreset(string $preset): RedirectResponse
    {
        try {
            $this->themes->applyPreset($preset);
            $this->alert->success("Preset '{$preset}' has been applied. Tweak anything — it is now your live config.")->flash();
        } catch (\InvalidArgumentException $e) {
            $this->alert->error($e->getMessage())->flash();
        }

        return redirect()->route('admin.aurora-theme');
    }

    /**
     * Reset the theme to factory defaults.
     */
    public function reset(): RedirectResponse
    {
        $this->themes->reset();
        $this->alert->success('Theme settings have been reset to defaults.')->flash();

        return redirect()->route('admin.aurora-theme');
    }

    /**
     * Upload a brand asset (logo / favicon). JSON endpoint used by the
     * settings page via fetch; CSRF-protected like every admin route.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'slot' => 'required|in:logo,favicon',
            'file' => 'required|file|image|mimes:png,jpg,jpeg,gif,svg,webp,ico|max:' . config('aurora.upload_max_kb', 2048),
        ]);

        try {
            $url = $this->themes->handleUpload($request->file('file'), $request->input('slot'));

            return response()->json(['url' => $url]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Download the current config as JSON.
     */
    public function export(): StreamedResponse
    {
        $json = $this->themes->export();

        return response()->streamDownload(
            function () use ($json) {
                echo $json;
            },
            'aurora-theme-config.json',
            ['Content-Type' => 'application/json']
        );
    }

    /**
     * Import a previously exported JSON config.
     */
    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'config' => 'required|file|max:256',
        ]);

        try {
            $contents = file_get_contents($request->file('config')->getRealPath());
            $this->themes->import($contents === false ? '' : $contents);
            $this->alert->success('Theme configuration imported successfully.')->flash();
        } catch (\InvalidArgumentException $e) {
            $this->alert->error('Import failed: ' . $e->getMessage())->flash();
        }

        return redirect()->route('admin.aurora-theme');
    }
}
