@extends('layouts.admin')

@section('title')
    Theme Settings
@endsection

@section('content-header')
    <h1>Theme Settings<small>Aurora v{{ $themeVersion }} — changes apply instantly across the panel.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Theme Settings</li>
    </ol>
@endsection

@section('content')
<link rel="stylesheet" href="{{ asset('themes/aurora/theme-settings.css') }}?v={{ $themeVersion }}">
<div class="row">
    <div class="col-md-8 col-xs-12">
        <form id="auroraThemeForm" action="{{ route('admin.aurora-theme.update') }}" method="POST" enctype="multipart/form-data">
            @csrf
            @method('PATCH')

            <div class="nav-tabs-custom aurora-box" style="background: var(--aurora-card); border: 1px solid var(--aurora-border); border-radius: var(--aurora-radius);">
                <ul class="nav nav-tabs aurora-settings-tabs">
                    <li class="active"><a href="#tab-general" data-toggle="tab">General</a></li>
                    <li><a href="#tab-colors" data-toggle="tab">Colors</a></li>
                    <li><a href="#tab-appearance" data-toggle="tab">Appearance</a></li>
                    <li><a href="#tab-animations" data-toggle="tab">Animations</a></li>
                    <li><a href="#tab-pixel" data-toggle="tab">Pixel</a></li>
                    <li><a href="#tab-typography" data-toggle="tab">Typography</a></li>
                    <li><a href="#tab-login" data-toggle="tab">Login</a></li>
                    <li><a href="#tab-presets" data-toggle="tab">Presets</a></li>
                    <li><a href="#tab-backup" data-toggle="tab">Backup</a></li>
                </ul>

                <div class="tab-content" style="padding: 18px;">
                    {{-- GENERAL --}}
                    <div class="tab-pane active" id="tab-general">
                        <div class="aurora-field-row">
                            <label>Brand name</label>
                            <input class="form-control" type="text" name="brand[name]" maxlength="120" value="{{ old('brand.name', $config['brand']['name']) }}" placeholder="Defaults to the panel name">
                            <p class="aurora-field-desc">Shown in the top bar, login screen and browser tab.</p>
                        </div>
                        <div class="aurora-field-row">
                            <label>Brand description</label>
                            <input class="form-control" type="text" name="brand[description]" maxlength="500" value="{{ old('brand.description', $config['brand']['description']) }}">
                            <p class="aurora-field-desc">Shown on the login artwork panel.</p>
                        </div>
                        <div class="aurora-field-row">
                            <label>Logo URL</label>
                            <input class="form-control" type="text" name="brand[logoUrl]" maxlength="500" value="{{ old('brand.logoUrl', $config['brand']['logoUrl']) }}" placeholder="/themes/aurora/uploads/logo-….png">
                            <div style="display:flex; gap:8px; margin-top:8px; align-items:center; flex-wrap:wrap;">
                                <input type="file" id="upload-logo" accept=".png,.jpg,.jpeg,.gif,.svg,.webp,.ico,image/*">
                                <button type="button" class="btn btn-default btn-sm aurora-upload-btn" data-slot="logo" data-url="{{ route('admin.aurora-theme.upload') }}">Upload</button>
                            </div>
                            @if(!empty($config['brand']['logoUrl']))
                                <img id="preview-logo" class="aurora-logo-preview" src="{{ $config['brand']['logoUrl'] }}" alt="Logo preview">
                            @else
                                <img id="preview-logo" class="aurora-logo-preview" src="" alt="" style="display:none;">
                            @endif
                        </div>
                        <div class="aurora-field-row">
                            <label>Favicon URL</label>
                            <input class="form-control" type="text" name="brand[faviconUrl]" maxlength="500" value="{{ old('brand.faviconUrl', $config['brand']['faviconUrl']) }}" placeholder="/themes/aurora/uploads/favicon-….png">
                            <div style="display:flex; gap:8px; margin-top:8px; align-items:center; flex-wrap:wrap;">
                                <input type="file" id="upload-favicon" accept=".png,.jpg,.jpeg,.gif,.svg,.webp,.ico,image/*">
                                <button type="button" class="btn btn-default btn-sm aurora-upload-btn" data-slot="favicon" data-url="{{ route('admin.aurora-theme.upload') }}">Upload</button>
                            </div>
                            @if(!empty($config['brand']['faviconUrl']))
                                <img id="preview-favicon" class="aurora-logo-preview" src="{{ $config['brand']['faviconUrl'] }}" alt="Favicon preview">
                            @else
                                <img id="preview-favicon" class="aurora-logo-preview" src="" alt="" style="display:none;">
                            @endif
                        </div>
                        <div class="aurora-field-row">
                            <label>Footer text</label>
                            <input class="form-control" type="text" name="brand[footerText]" maxlength="500" value="{{ old('brand.footerText', $config['brand']['footerText']) }}" placeholder="Optional — replaces the login footer credit line">
                        </div>
                    </div>

                    {{-- COLORS --}}
                    <div class="tab-pane" id="tab-colors">
                        <p class="aurora-field-desc" style="margin-top:0;">Every color updates the live preview instantly. Changes apply panel-wide on save.</p>
                        <div class="aurora-color-grid">
                            @foreach (['primary' => 'Primary', 'secondary' => 'Secondary', 'accent' => 'Accent', 'background' => 'Background', 'surface' => 'Surface', 'card' => 'Card', 'text' => 'Text', 'muted' => 'Muted text', 'border' => 'Border', 'success' => 'Success', 'warning' => 'Warning', 'danger' => 'Danger', 'info' => 'Info'] as $key => $label)
                                <div class="aurora-color-field">
                                    <input type="color" value="{{ old("colors.$key", $config['colors'][$key]) }}" aria-label="{{ $label }} picker">
                                    <div class="aurora-color-meta">
                                        <small>{{ $label }}</small>
                                        <input type="text" name="colors[{{ $key }}]" maxlength="9" value="{{ old("colors.$key", $config['colors'][$key]) }}" aria-label="{{ $label }} hex">
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>

                    {{-- APPEARANCE --}}
                    <div class="tab-pane" id="tab-appearance">
                        <div class="aurora-field-row">
                            <label>Color mode</label>
                            <select class="form-control" name="appearance[mode]">
                                @foreach (['system' => 'System (follow OS)', 'dark' => 'Dark', 'light' => 'Light'] as $v => $l)
                                    <option value="{{ $v }}" {{ old('appearance.mode', $config['appearance']['mode']) === $v ? 'selected' : '' }}>{{ $l }}</option>
                                @endforeach
                            </select>
                        </div>
                        <input type="hidden" name="appearance[allowUserSwitch]" value="0">
                        <label class="aurora-check"><input type="checkbox" name="appearance[allowUserSwitch]" value="1" {{ old('appearance.allowUserSwitch', $config['appearance']['allowUserSwitch']) ? 'checked' : '' }}><span><strong>Allow users to switch mode</strong><span>Shows a light/dark/system switcher in the top bar.</span></span></label>
                        <div class="aurora-field-row">
                            <label>Sidebar style</label>
                            <select class="form-control" name="appearance[sidebarStyle]">
                                @foreach (['floating' => 'Floating card', 'fixed' => 'Fixed panel', 'top' => 'Top navigation only'] as $v => $l)
                                    <option value="{{ $v }}" {{ old('appearance.sidebarStyle', $config['appearance']['sidebarStyle']) === $v ? 'selected' : '' }}>{{ $l }}</option>
                                @endforeach
                            </select>
                        </div>
                        <input type="hidden" name="appearance[sidebarCollapsed]" value="0">
                        <label class="aurora-check"><input type="checkbox" name="appearance[sidebarCollapsed]" value="1" {{ old('appearance.sidebarCollapsed', $config['appearance']['sidebarCollapsed']) ? 'checked' : '' }}><span><strong>Collapse sidebar by default</strong><span>Users can still expand it; their choice is remembered.</span></span></label>
                        <input type="hidden" name="appearance[compact]" value="0">
                        <label class="aurora-check"><input type="checkbox" name="appearance[compact]" value="1" {{ old('appearance.compact', $config['appearance']['compact']) ? 'checked' : '' }}><span><strong>Compact mode</strong><span>Tighter card padding across the panel.</span></span></label>
                        <input type="hidden" name="appearance[dense]" value="0">
                        <label class="aurora-check"><input type="checkbox" name="appearance[dense]" value="1" {{ old('appearance.dense', $config['appearance']['dense']) ? 'checked' : '' }}><span><strong>Dense mode</strong><span>Smaller gaps and stat text. Pairs well with compact mode.</span></span></label>
                        <div class="aurora-field-row">
                            <label>Server card layout</label>
                            <select class="form-control" name="appearance[cardLayout]">
                                @foreach (['grid' => 'Grid', 'list' => 'List'] as $v => $l)
                                    <option value="{{ $v }}" {{ old('appearance.cardLayout', $config['appearance']['cardLayout']) === $v ? 'selected' : '' }}>{{ $l }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="aurora-field-row">
                            <label>Border radius</label>
                            <div class="aurora-range-row">
                                <input type="range" name="appearance[radius]" min="0" max="24" step="1" value="{{ old('appearance.radius', $config['appearance']['radius']) }}" data-output="#radius-out" data-suffix="px">
                                <output id="radius-out"></output>
                            </div>
                        </div>
                        <div class="aurora-field-row">
                            <label>Shadow intensity</label>
                            <select class="form-control" name="appearance[shadow]">
                                @foreach (['none' => 'None', 'soft' => 'Soft', 'medium' => 'Medium', 'strong' => 'Strong'] as $v => $l)
                                    <option value="{{ $v }}" {{ old('appearance.shadow', $config['appearance']['shadow']) === $v ? 'selected' : '' }}>{{ $l }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>

                    {{-- ANIMATIONS --}}
                    <div class="tab-pane" id="tab-animations">
                        <p class="aurora-field-desc" style="margin-top:0;">Users with <code>prefers-reduced-motion</code> set at OS level always get a static interface, regardless of these settings.</p>
                        <input type="hidden" name="animations[enabled]" value="0">
                        <label class="aurora-check"><input type="checkbox" name="animations[enabled]" value="1" {{ old('animations.enabled', $config['animations']['enabled']) ? 'checked' : '' }}><span><strong>Enable animations</strong><span>Master switch for all theme motion.</span></span></label>
                        <div class="aurora-field-row">
                            <label>Animation intensity</label>
                            <select class="form-control" name="animations[intensity]">
                                @foreach (['subtle' => 'Subtle', 'normal' => 'Normal', 'playful' => 'Playful'] as $v => $l)
                                    <option value="{{ $v }}" {{ old('animations.intensity', $config['animations']['intensity']) === $v ? 'selected' : '' }}>{{ $l }}</option>
                                @endforeach
                            </select>
                        </div>
                        @foreach (['pageTransitions' => ['Page transitions', 'Fade/slide between pages.'], 'hoverEffects' => ['Hover effects', 'Card lift and highlight on hover.'], 'buttonEffects' => ['Button effects', 'Press and lift feedback on buttons.'], 'modalAnimations' => ['Modal animations', 'Pop-in dialogs and drawers.'], 'backgroundEffects' => ['Background effects', 'Ambient gradient glows behind content.']] as $k => [$l, $d])
                            <input type="hidden" name="animations[{{ $k }}]" value="0">
                            <label class="aurora-check"><input type="checkbox" name="animations[{{ $k }}]" value="1" {{ old("animations.$k", $config['animations'][$k]) ? 'checked' : '' }}><span><strong>{{ $l }}</strong><span>{{ $d }}</span></span></label>
                        @endforeach
                        <div class="aurora-field-row">
                            <label>Loading indicator</label>
                            <select class="form-control" name="animations[loadingStyle]">
                                @foreach (['skeleton' => 'Skeleton cards', 'spinner' => 'Spinner', 'dots' => 'Bouncing dots'] as $v => $l)
                                    <option value="{{ $v }}" {{ old('animations.loadingStyle', $config['animations']['loadingStyle']) === $v ? 'selected' : '' }}>{{ $l }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>

                    {{-- PIXEL --}}
                    <div class="tab-pane" id="tab-pixel">
                        <input type="hidden" name="pixel[enabled]" value="0">
                        <label class="aurora-check"><input type="checkbox" name="pixel[enabled]" value="1" {{ old('pixel.enabled', $config['pixel']['enabled']) ? 'checked' : '' }}><span><strong>Pixel style</strong><span>Subtle pixel accents: dotted texture, squared icon tiles, pixel markers.</span></span></label>
                        <div class="aurora-field-row">
                            <label>Pixel intensity</label>
                            <select class="form-control" name="pixel[intensity]">
                                @foreach (['subtle' => 'Subtle', 'normal' => 'Normal', 'bold' => 'Bold'] as $v => $l)
                                    <option value="{{ $v }}" {{ old('pixel.intensity', $config['pixel']['intensity']) === $v ? 'selected' : '' }}>{{ $l }}</option>
                                @endforeach
                            </select>
                        </div>
                        <input type="hidden" name="pixel[decorations]" value="0">
                        <label class="aurora-check"><input type="checkbox" name="pixel[decorations]" value="1" {{ old('pixel.decorations', $config['pixel']['decorations']) ? 'checked' : '' }}><span><strong>Pixel decorations</strong><span>Card markers and dotted background texture.</span></span></label>
                        <input type="hidden" name="pixel[pixelIcons]" value="0">
                        <label class="aurora-check"><input type="checkbox" name="pixel[pixelIcons]" value="1" {{ old('pixel.pixelIcons', $config['pixel']['pixelIcons']) ? 'checked' : '' }}><span><strong>Pixelated icons</strong><span>Crisp pixel rendering for the brand mark and tiles.</span></span></label>
                    </div>

                    {{-- TYPOGRAPHY --}}
                    <div class="tab-pane" id="tab-typography">
                        <div class="aurora-field-row">
                            <label>Font family</label>
                            <select class="form-control" name="typography[fontFamily]">
                                @foreach (['system' => 'System (iOS-like)', 'plex' => 'IBM Plex Sans (bundled)', 'inter' => 'Inter-style (system stack)', 'mono' => 'Monospace', 'rounded' => 'Rounded'] as $v => $l)
                                    <option value="{{ $v }}" {{ old('typography.fontFamily', $config['typography']['fontFamily']) === $v ? 'selected' : '' }}>{{ $l }}</option>
                                @endforeach
                            </select>
                            <p class="aurora-field-desc">All stacks are local system fonts (plus the bundled Plex Sans) — no external font service required.</p>
                        </div>
                        <div class="aurora-field-row">
                            <label>Base font size</label>
                            <div class="aurora-range-row">
                                <input type="range" name="typography[baseSize]" min="13" max="18" step="1" value="{{ old('typography.baseSize', $config['typography']['baseSize']) }}" data-output="#base-size-out" data-suffix="px">
                                <output id="base-size-out"></output>
                            </div>
                        </div>
                        <div class="aurora-field-row">
                            <label>Heading scale</label>
                            <div class="aurora-range-row">
                                <input type="range" name="typography[headingScale]" min="0.9" max="1.3" step="0.05" value="{{ old('typography.headingScale', $config['typography']['headingScale']) }}" data-output="#heading-scale-out" data-suffix="×">
                                <output id="heading-scale-out"></output>
                            </div>
                        </div>
                        <div class="aurora-field-row">
                            <label>Font weight</label>
                            <select class="form-control" name="typography[weight]">
                                @foreach (['300' => 'Light (300)', '400' => 'Regular (400)', '500' => 'Medium (500)', '600' => 'Semibold (600)'] as $v => $l)
                                    <option value="{{ $v }}" {{ old('typography.weight', $config['typography']['weight']) === $v ? 'selected' : '' }}>{{ $l }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="aurora-field-row">
                            <label>Line height</label>
                            <div class="aurora-range-row">
                                <input type="range" name="typography[lineHeight]" min="1.3" max="1.9" step="0.05" value="{{ old('typography.lineHeight', $config['typography']['lineHeight']) }}" data-output="#line-height-out">
                                <output id="line-height-out"></output>
                            </div>
                        </div>
                    </div>

                    {{-- LOGIN --}}
                    <div class="tab-pane" id="tab-login">
                        <div class="aurora-field-row">
                            <label>Login title</label>
                            <input class="form-control" type="text" name="login[title]" maxlength="200" value="{{ old('login.title', $config['login']['title']) }}" placeholder="Empty = default per screen">
                        </div>
                        <div class="aurora-field-row">
                            <label>Login subtitle</label>
                            <input class="form-control" type="text" name="login[subtitle]" maxlength="200" value="{{ old('login.subtitle', $config['login']['subtitle']) }}" placeholder="Empty = automatic">
                        </div>
                        <input type="hidden" name="login[showLogo]" value="0">
                        <label class="aurora-check"><input type="checkbox" name="login[showLogo]" value="1" {{ old('login.showLogo', $config['login']['showLogo']) ? 'checked' : '' }}><span><strong>Show logo</strong><span>Display the brand logo above the login card.</span></span></label>
                        <div class="aurora-field-row">
                            <label>Background</label>
                            <select class="form-control" name="login[background]">
                                @foreach (['mesh' => 'Mesh glow', 'gradient' => 'Gradient', 'grid' => 'Grid', 'plain' => 'Plain'] as $v => $l)
                                    <option value="{{ $v }}" {{ old('login.background', $config['login']['background']) === $v ? 'selected' : '' }}>{{ $l }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="aurora-field-row">
                            <label>Card style</label>
                            <select class="form-control" name="login[cardStyle]">
                                @foreach (['glass' => 'Glass', 'solid' => 'Solid', 'outline' => 'Outline'] as $v => $l)
                                    <option value="{{ $v }}" {{ old('login.cardStyle', $config['login']['cardStyle']) === $v ? 'selected' : '' }}>{{ $l }}</option>
                                @endforeach
                            </select>
                        </div>
                        <input type="hidden" name="login[sideArt]" value="0">
                        <label class="aurora-check"><input type="checkbox" name="login[sideArt]" value="1" {{ old('login.sideArt', $config['login']['sideArt']) ? 'checked' : '' }}><span><strong>Artwork panel</strong><span>Wide split layout with brand artwork on desktop.</span></span></label>
                    </div>

                    {{-- PRESETS --}}
                    <div class="tab-pane" id="tab-presets">
                        <p class="aurora-field-desc" style="margin-top:0;">Applying a preset writes a real configuration — every value stays editable afterwards.</p>
                        <div class="aurora-preset-grid">
                            @foreach ($presets as $key => $preset)
                                <div class="aurora-preset">
                                    <h4>{{ $preset['label'] }}</h4>
                                    <p>{{ $preset['description'] }}</p>
                                    <div class="aurora-preset-dots">
                                        @foreach (['primary', 'secondary', 'accent', 'background'] as $dot)
                                            <span style="background: {{ $preset['config']['colors'][$dot] ?? '#888' }};"></span>
                                        @endforeach
                                    </div>
                                    <button type="button" class="btn btn-default btn-sm aurora-alt-submit" data-action="{{ route('admin.aurora-theme.preset', $key) }}" data-confirm="Apply the '{{ $preset['label'] }}' preset? Your current settings will be replaced.">Apply {{ $preset['label'] }}</button>
                                </div>
                            @endforeach
                        </div>
                    </div>

                    {{-- BACKUP --}}
                    <div class="tab-pane" id="tab-backup">
                        <div class="aurora-field-row">
                            <label>Export configuration</label>
                            <p class="aurora-field-desc" style="margin-top:0;">Download the current theme as a portable JSON file.</p>
                            <a href="{{ route('admin.aurora-theme.export') }}" class="btn btn-default"><i class="fa fa-download"></i> Download JSON</a>
                        </div>
                        <div class="aurora-field-row">
                            <label>Import configuration</label>
                            <p class="aurora-field-desc" style="margin-top:0;">Restore a previously exported JSON file. Values are validated before saving.</p>
                            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                                <label class="btn btn-default" style="margin:0; cursor:pointer;">
                                    <span id="import-file-label">Choose file…</span>
                                    <input type="file" id="import-file" name="config" accept=".json,application/json" style="display:none;">
                                </label>
                                <button type="button" class="btn btn-primary aurora-alt-submit" data-action="{{ route('admin.aurora-theme.import') }}"><i class="fa fa-upload"></i> Import</button>
                            </div>
                        </div>
                        <div class="aurora-field-row">
                            <label>Reset to defaults</label>
                            <p class="aurora-field-desc" style="margin-top:0;">Restore the factory Aurora configuration. Uploaded logos are kept.</p>
                            <button type="button" class="btn btn-danger aurora-alt-submit" data-action="{{ route('admin.aurora-theme.reset') }}" data-confirm="Reset ALL theme settings to defaults? This cannot be undone."><i class="fa fa-refresh"></i> Reset to defaults</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="aurora-savebar">
                <span class="text-muted" style="margin-right:auto; font-size:12px;">Aurora {{ $themeVersion }} · <a href="/aurora/theme.json" target="_blank" rel="noreferrer">theme.json</a></span>
                <button type="submit" class="btn btn-primary btn-lg"><i class="fa fa-save"></i> Save Changes</button>
            </div>
        </form>
    </div>

    <div class="col-md-4 col-xs-12">
        <div class="aurora-preview-sticky">
            <div class="box aurora-box">
                <div class="box-header with-border">
                    <h3 class="box-title">Live Preview</h3>
                </div>
                <div class="box-body">
                    <div class="aurora-preview" id="auroraPreview" data-pixel="0">
                        <div class="aurora-preview-bar">
                            <span class="dot" style="background:#ff5f57;"></span>
                            <span class="dot" style="background:#febc2e;"></span>
                            <span class="dot" style="background:#28c840;"></span>
                            <img id="auroraPreviewLogo" src="" alt="" style="height:18px; display:none; margin-left:4px;">
                            <svg id="auroraPreviewMark" width="18" height="18" viewBox="0 0 32 32" style="margin-left:4px;"><rect x="7" y="7" width="6" height="6" fill="var(--ap-primary,#4f7cff)"/><rect x="13" y="7" width="12" height="6" fill="var(--ap-primary,#4f7cff)" opacity=".7"/><rect x="7" y="13" width="12" height="6" fill="var(--ap-primary,#4f7cff)" opacity=".85"/><rect x="19" y="13" width="6" height="6" fill="var(--ap-primary,#4f7cff)"/></svg>
                            <strong id="auroraPreviewBrand" style="font-size:12px;">Your Panel</strong>
                        </div>
                        <div class="aurora-preview-body">
                            <div class="aurora-preview-card">
                                <h5>survival-01</h5>
                                <p>play.example.com:25565</p>
                                <div class="aurora-preview-row" style="margin-top:8px;">
                                    <span class="aurora-preview-badge">● Running</span>
                                    <span style="color: var(--ap-muted); font-size:11px;">CPU 42% · RAM 3.1G</span>
                                </div>
                            </div>
                            <div class="aurora-preview-row">
                                <button type="button" class="aurora-preview-btn" tabindex="-1">Start</button>
                                <button type="button" class="aurora-preview-btn ghost" tabindex="-1">Restart</button>
                            </div>
                            <div class="aurora-preview-login glass" id="auroraPreviewLogin">
                                <strong style="font-size:12px;">Login card style</strong>
                                <p style="margin:4px 0 0; font-size:11px; color: var(--ap-muted);">Updates with the Login tab</p>
                            </div>
                        </div>
                    </div>
                    <p class="aurora-preview-note" style="margin:10px 0 0;">The preview updates as you type — no reload needed. Press <strong>Save Changes</strong> to publish.</p>
                </div>
            </div>
            <div class="box aurora-box">
                <div class="box-header with-border">
                    <h3 class="box-title">Shortcuts</h3>
                </div>
                <div class="box-body">
                    <p style="margin-bottom:8px;"><a href="{{ route('index') }}" class="btn btn-default btn-sm btn-block"><i class="fa fa-eye"></i> View user dashboard</a></p>
                    <p style="margin-bottom:8px;"><a href="/auth/login" target="_blank" rel="noreferrer" class="btn btn-default btn-sm btn-block"><i class="fa fa-sign-in"></i> View login screen</a></p>
                    <p style="margin:0;"><a href="{{ route('admin.aurora-theme.export') }}" class="btn btn-default btn-sm btn-block"><i class="fa fa-download"></i> Export config</a></p>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script src="{{ asset('themes/aurora/theme-settings.js') }}?v={{ $themeVersion }}" type="application/javascript"></script>
@endsection
