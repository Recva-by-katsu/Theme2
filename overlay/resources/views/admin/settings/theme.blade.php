@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'theme'])

@section('title')
    Theme Settings
@endsection

@section('content-header')
    <h1>Theme Settings<small>Customize the Orbit panel experience for users and administrators.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Theme Settings</li>
    </ol>
@endsection

@section('content')
    @yield('settings::nav')

    <div class="row">
        <div class="col-xs-12 col-lg-8">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">Theme Configuration</h3>
                </div>
                <form action="{{ route('admin.settings.theme.update') }}" method="POST" id="theme-settings-form">
                    {!! csrf_field() !!}
                    <input type="hidden" name="_method" value="PATCH" />
                    <div class="box-body">
                        <h4 class="m-t-0">General</h4>
                        <div class="row">
                            <div class="form-group col-sm-6">
                                <label class="control-label">Theme Name</label>
                                <input type="text" class="form-control" name="theme[theme_name]" value="{{ old('theme.theme_name', data_get($theme, 'theme_name')) }}" required />
                            </div>
                            <div class="form-group col-sm-6">
                                <label class="control-label">Brand Name</label>
                                <input type="text" class="form-control" name="theme[brand_name]" value="{{ old('theme.brand_name', data_get($theme, 'brand_name')) }}" required />
                            </div>
                            <div class="form-group col-sm-12">
                                <label class="control-label">Brand Description</label>
                                <input type="text" class="form-control" name="theme[brand_description]" value="{{ old('theme.brand_description', data_get($theme, 'brand_description')) }}" />
                            </div>
                        </div>

                        <h4>Theme Preset</h4>
                        <div class="row m-b-15">
                            <div class="form-group col-sm-6">
                                <label class="control-label">Preset</label>
                                <select class="form-control" name="theme[preset]" id="theme-preset-selector">
                                    @foreach($presets as $key => $preset)
                                        <option value="{{ $key }}" @selected(old('theme.preset', data_get($theme, 'preset')) === $key)>{{ $preset['label'] }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="form-group col-sm-6">
                                <label class="control-label">Default Mode</label>
                                <select class="form-control" name="theme[appearance][default_mode]">
                                    @foreach(['light' => 'Light', 'dark' => 'Dark', 'system' => 'System'] as $value => $label)
                                        <option value="{{ $value }}" @selected(old('theme.appearance.default_mode', data_get($theme, 'appearance.default_mode')) === $value)>{{ $label }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>

                        <h4>Brand Assets</h4>
                        <div class="row">
                            <div class="form-group col-sm-4">
                                <label class="control-label">Logo URL</label>
                                <input type="text" class="form-control" name="theme[assets][logo]" value="{{ old('theme.assets.logo', data_get($theme, 'assets.logo')) }}" />
                            </div>
                            <div class="form-group col-sm-4">
                                <label class="control-label">Favicon URL</label>
                                <input type="text" class="form-control" name="theme[assets][favicon]" value="{{ old('theme.assets.favicon', data_get($theme, 'assets.favicon')) }}" />
                            </div>
                            <div class="form-group col-sm-4">
                                <label class="control-label">Site Icon URL</label>
                                <input type="text" class="form-control" name="theme[assets][site_icon]" value="{{ old('theme.assets.site_icon', data_get($theme, 'assets.site_icon')) }}" />
                            </div>
                        </div>

                        <h4>Colors</h4>
                        <div class="row">
                            @foreach([
                                'primary' => 'Primary',
                                'secondary' => 'Secondary',
                                'accent' => 'Accent',
                                'background' => 'Background',
                                'surface' => 'Surface',
                                'card' => 'Card',
                                'text' => 'Text',
                                'muted_text' => 'Muted Text',
                                'border' => 'Border',
                            ] as $key => $label)
                                <div class="form-group col-sm-4">
                                    <label class="control-label">{{ $label }}</label>
                                    <input type="color" class="form-control theme-color-input" name="theme[colors][{{ $key }}]" value="{{ old('theme.colors.' . $key, data_get($theme, 'colors.' . $key)) }}" />
                                </div>
                            @endforeach
                        </div>

                        <h4>Layout & Appearance</h4>
                        <div class="row">
                            <div class="form-group col-sm-3">
                                <label class="control-label">Border Radius</label>
                                <input type="number" min="6" max="28" class="form-control" name="theme[radius]" id="theme-radius" value="{{ old('theme.radius', data_get($theme, 'radius')) }}" />
                            </div>
                            <div class="form-group col-sm-3">
                                <label class="control-label">Shadow Intensity</label>
                                <select class="form-control" name="theme[shadow_intensity]">
                                    @foreach(['none' => 'None', 'soft' => 'Soft', 'medium' => 'Medium', 'strong' => 'Strong'] as $value => $label)
                                        <option value="{{ $value }}" @selected(old('theme.shadow_intensity', data_get($theme, 'shadow_intensity')) === $value)>{{ $label }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="form-group col-sm-3">
                                <label class="control-label">Sidebar Style</label>
                                <select class="form-control" name="theme[appearance][sidebar_style]">
                                    @foreach(['solid' => 'Solid', 'floating' => 'Floating', 'glass' => 'Glass'] as $value => $label)
                                        <option value="{{ $value }}" @selected(old('theme.appearance.sidebar_style', data_get($theme, 'appearance.sidebar_style')) === $value)>{{ $label }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="form-group col-sm-3">
                                <label class="control-label">Sidebar Width</label>
                                <select class="form-control" name="theme[appearance][sidebar_width]">
                                    @foreach(['compact' => 'Compact', 'normal' => 'Normal', 'wide' => 'Wide'] as $value => $label)
                                        <option value="{{ $value }}" @selected(old('theme.appearance.sidebar_width', data_get($theme, 'appearance.sidebar_width')) === $value)>{{ $label }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-sm-3">
                                <label class="control-label">Card Layout</label>
                                <select class="form-control" name="theme[appearance][card_layout]">
                                    @foreach(['grid' => 'Grid', 'comfortable' => 'Comfortable', 'compact' => 'Compact'] as $value => $label)
                                        <option value="{{ $value }}" @selected(old('theme.appearance.card_layout', data_get($theme, 'appearance.card_layout')) === $value)>{{ $label }}</option>
                                    @endforeach
                                </select>
                            </div>
                            @foreach([
                                'allow_user_theme' => 'Allow users to switch mode',
                                'sidebar_collapse' => 'Collapsed sidebar default',
                                'compact_mode' => 'Compact mode',
                                'dense_mode' => 'Dense mode',
                            ] as $key => $label)
                                <div class="form-group col-sm-2">
                                    <label class="control-label">{{ $label }}</label>
                                    <div>
                                        <input type="hidden" name="theme[appearance][{{ $key }}]" value="0" />
                                        <input type="checkbox" value="1" name="theme[appearance][{{ $key }}]" @checked(old('theme.appearance.' . $key, data_get($theme, 'appearance.' . $key))) />
                                    </div>
                                </div>
                            @endforeach
                        </div>

                        <h4>Animations</h4>
                        <div class="row">
                            <div class="form-group col-sm-3">
                                <label class="control-label">Animation Intensity</label>
                                <select class="form-control" name="theme[animation][intensity]">
                                    @foreach(['subtle' => 'Subtle', 'medium' => 'Medium', 'high' => 'High'] as $value => $label)
                                        <option value="{{ $value }}" @selected(old('theme.animation.intensity', data_get($theme, 'animation.intensity')) === $value)>{{ $label }}</option>
                                    @endforeach
                                </select>
                            </div>
                            @foreach([
                                'enabled' => 'Animations enabled',
                                'page_transitions' => 'Page transitions',
                                'hover_effects' => 'Hover effects',
                                'button_effects' => 'Button effects',
                                'modal_animations' => 'Modal animations',
                                'background_effects' => 'Background effects',
                                'loading_animations' => 'Loading animations',
                            ] as $key => $label)
                                <div class="form-group col-sm-3">
                                    <label class="control-label">{{ $label }}</label>
                                    <div>
                                        <input type="hidden" name="theme[animation][{{ $key }}]" value="0" />
                                        <input type="checkbox" value="1" name="theme[animation][{{ $key }}]" @checked(old('theme.animation.' . $key, data_get($theme, 'animation.' . $key))) />
                                    </div>
                                </div>
                            @endforeach
                        </div>

                        <h4>Pixel Style</h4>
                        <div class="row">
                            <div class="form-group col-sm-3">
                                <label class="control-label">Pixel Intensity</label>
                                <input type="range" min="0" max="100" class="form-control" name="theme[pixel][intensity]" value="{{ old('theme.pixel.intensity', data_get($theme, 'pixel.intensity')) }}" />
                            </div>
                            @foreach(['enabled' => 'Pixel style', 'decorations' => 'Decorations', 'icons' => 'Pixel icons'] as $key => $label)
                                <div class="form-group col-sm-3">
                                    <label class="control-label">{{ $label }}</label>
                                    <div>
                                        <input type="hidden" name="theme[pixel][{{ $key }}]" value="0" />
                                        <input type="checkbox" value="1" name="theme[pixel][{{ $key }}]" @checked(old('theme.pixel.' . $key, data_get($theme, 'pixel.' . $key))) />
                                    </div>
                                </div>
                            @endforeach
                        </div>

                        <h4>Typography</h4>
                        <div class="row">
                            <div class="form-group col-sm-4">
                                <label class="control-label">Font Family</label>
                                <input type="text" class="form-control" name="theme[typography][font_family]" value="{{ old('theme.typography.font_family', data_get($theme, 'typography.font_family')) }}" />
                            </div>
                            <div class="form-group col-sm-2">
                                <label class="control-label">Base Size</label>
                                <input type="number" min="13" max="18" class="form-control" name="theme[typography][font_size]" value="{{ old('theme.typography.font_size', data_get($theme, 'typography.font_size')) }}" />
                            </div>
                            <div class="form-group col-sm-2">
                                <label class="control-label">Heading Scale</label>
                                <input type="number" step="0.01" min="1" max="1.35" class="form-control" name="theme[typography][heading_scale]" value="{{ old('theme.typography.heading_scale', data_get($theme, 'typography.heading_scale')) }}" />
                            </div>
                            <div class="form-group col-sm-2">
                                <label class="control-label">Font Weight</label>
                                <input type="number" min="400" max="700" class="form-control" name="theme[typography][font_weight]" value="{{ old('theme.typography.font_weight', data_get($theme, 'typography.font_weight')) }}" />
                            </div>
                            <div class="form-group col-sm-2">
                                <label class="control-label">Line Height</label>
                                <input type="number" step="0.05" min="1.2" max="1.7" class="form-control" name="theme[typography][line_height]" value="{{ old('theme.typography.line_height', data_get($theme, 'typography.line_height')) }}" />
                            </div>
                        </div>

                        <h4>Login Screen</h4>
                        <div class="row">
                            <div class="form-group col-sm-6">
                                <label class="control-label">Login Title</label>
                                <input type="text" class="form-control" name="theme[login][title]" value="{{ old('theme.login.title', data_get($theme, 'login.title')) }}" required />
                            </div>
                            <div class="form-group col-sm-6">
                                <label class="control-label">Login Description</label>
                                <input type="text" class="form-control" name="theme[login][description]" value="{{ old('theme.login.description', data_get($theme, 'login.description')) }}" required />
                            </div>
                            <div class="form-group col-sm-4">
                                <label class="control-label">Login Logo URL</label>
                                <input type="text" class="form-control" name="theme[login][logo]" value="{{ old('theme.login.logo', data_get($theme, 'login.logo')) }}" />
                            </div>
                            <div class="form-group col-sm-4">
                                <label class="control-label">Background URL</label>
                                <input type="text" class="form-control" name="theme[login][background]" value="{{ old('theme.login.background', data_get($theme, 'login.background')) }}" />
                            </div>
                            <div class="form-group col-sm-2">
                                <label class="control-label">Accent Color</label>
                                <input type="color" class="form-control theme-color-input" name="theme[login][accent_color]" value="{{ old('theme.login.accent_color', data_get($theme, 'login.accent_color')) }}" />
                            </div>
                            <div class="form-group col-sm-2">
                                <label class="control-label">Card Style</label>
                                <select class="form-control" name="theme[login][card_style]">
                                    @foreach(['elevated' => 'Elevated', 'minimal' => 'Minimal', 'glass' => 'Glass'] as $value => $label)
                                        <option value="{{ $value }}" @selected(old('theme.login.card_style', data_get($theme, 'login.card_style')) === $value)>{{ $label }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="form-group col-sm-3">
                                <label class="control-label">Login Illustration URL</label>
                                <input type="text" class="form-control" name="theme[login][illustration]" value="{{ old('theme.login.illustration', data_get($theme, 'login.illustration')) }}" />
                            </div>
                            <div class="form-group col-sm-3">
                                <label class="control-label">Background Effects</label>
                                <div>
                                    <input type="hidden" name="theme[login][background_effects]" value="0" />
                                    <input type="checkbox" value="1" name="theme[login][background_effects]" @checked(old('theme.login.background_effects', data_get($theme, 'login.background_effects'))) />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="box-footer text-right">
                        <button type="button" class="btn btn-default" id="theme-preview-reset">Reset Preview</button>
                        <button type="submit" class="btn btn-primary">Save Theme</button>
                    </div>
                </form>
            </div>
        </div>

        <div class="col-xs-12 col-lg-4">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">Live Preview</h3>
                </div>
                <div class="box-body">
                    <div id="theme-preview" class="theme-preview">
                        <h4 id="preview-brand">{{ data_get($theme, 'brand_name') }}</h4>
                        <p id="preview-description">{{ data_get($theme, 'brand_description') }}</p>
                        <button type="button" class="btn btn-primary btn-sm">Primary Action</button>
                        <button type="button" class="btn btn-default btn-sm">Secondary Action</button>
                    </div>
                    <p class="text-muted small m-t-15">Preview updates live for colors and radius. Changes apply globally after saving.</p>
                </div>
                <div class="box-footer text-right">
                    <form action="{{ route('admin.settings.theme.reset') }}" method="POST" style="display:inline-block">
                        {!! csrf_field() !!}
                        <input type="hidden" name="_method" value="DELETE" />
                        <button type="submit" class="btn btn-danger btn-sm">Reset to Defaults</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        (function () {
            const root = document.documentElement;
            const defaults = {
                style: root.getAttribute('style') || ''
            };

            const presetSelector = document.getElementById('theme-preset-selector');
            const presets = @json($presets);
            const colorMap = {
                primary: '--theme-primary',
                secondary: '--theme-secondary',
                accent: '--theme-accent',
                background: '--theme-bg',
                surface: '--theme-surface',
                card: '--theme-card',
                text: '--theme-text',
                muted_text: '--theme-muted',
                border: '--theme-border'
            };

            const applyColorToPreview = (input) => {
                if (!input) return;
                const field = input.name.match(/theme\[colors\]\[(.+)\]/);
                if (!field || !colorMap[field[1]]) return;
                root.style.setProperty(colorMap[field[1]], input.value);
            };

            document.querySelectorAll('.theme-color-input').forEach((input) => {
                applyColorToPreview(input);
                input.addEventListener('input', () => applyColorToPreview(input));
            });

            const radiusInput = document.getElementById('theme-radius');
            if (radiusInput) {
                radiusInput.addEventListener('input', (event) => {
                    root.style.setProperty('--theme-radius', `${event.target.value}px`);
                });
            }

            if (presetSelector) {
                presetSelector.addEventListener('change', () => {
                    const preset = presets[presetSelector.value];
                    if (!preset || !preset.colors) return;

                    Object.keys(preset.colors).forEach((key) => {
                        const input = document.querySelector(`[name="theme[colors][${key}]"]`);
                        if (!input) return;
                        input.value = preset.colors[key];
                        applyColorToPreview(input);
                    });
                });
            }

            const resetBtn = document.getElementById('theme-preview-reset');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    root.setAttribute('style', defaults.style);
                });
            }
        })();
    </script>
@endsection
