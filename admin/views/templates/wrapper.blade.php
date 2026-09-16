<!DOCTYPE html>
<html>
    <head>
        <title>{{ config('app.name', 'Pterodactyl') }}</title>

        @section('meta')
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
            <meta name="csrf-token" content="{{ csrf_token() }}">
            <meta name="robots" content="noindex">
            @php
                // Resolve the Aurora theme config defensively: the panel must keep
                // rendering even if the theme backend is ever missing or broken.
                $auroraTheme = null;
                try {
                    if (class_exists(\Pterodactyl\Services\AuroraThemeService::class)) {
                        $auroraTheme = app(\Pterodactyl\Services\AuroraThemeService::class)->publicConfig();
                    }
                } catch (\Throwable $e) {
                    $auroraTheme = null;
                }
                $auroraFavicon = $auroraTheme['brand']['faviconUrl'] ?? '';
                $auroraThemeColor = $auroraTheme['colors']['background'] ?? '#0b1020';
            @endphp
            @if(!empty($auroraFavicon))
                <link rel="icon" href="{{ $auroraFavicon }}">
            @else
                <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png">
                <link rel="icon" type="image/png" href="/favicons/favicon-32x32.png" sizes="32x32">
                <link rel="icon" type="image/png" href="/favicons/favicon-16x16.png" sizes="16x16">
                <link rel="manifest" href="/favicons/manifest.json">
                <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#bc6e3c">
                <link rel="shortcut icon" href="/favicons/favicon.ico">
                <meta name="msapplication-config" content="/favicons/browserconfig.xml">
            @endif
            <meta name="theme-color" content="{{ $auroraThemeColor }}">
        @show

        @section('user-data')
            @if(!is_null(Auth::user()))
                <script>
                    window.PterodactylUser = {!! json_encode(Auth::user()->toVueObject()) !!};
                </script>
            @endif
            @if(!empty($siteConfiguration))
                <script>
                    window.SiteConfiguration = {!! json_encode($siteConfiguration) !!};
                </script>
            @endif
            @if(!empty($auroraTheme))
                {{-- Aurora theme config: consumed by the React ThemeProvider before first paint. --}}
                <script>
                    window.AuroraTheme = {!! json_encode($auroraTheme) !!};
                </script>
                {{-- Pre-paint tokens: prevents a light flash before the bundle hydrates. --}}
                <script>
                    (function () {
                        try {
                            var t = window.AuroraTheme || {};
                            var c = t.colors || {};
                            var root = document.documentElement;
                            if (c.background) root.style.setProperty('--aurora-bg', c.background);
                            if (c.surface) root.style.setProperty('--aurora-surface', c.surface);
                            if (c.text) root.style.setProperty('--aurora-text', c.text);
                            var mode = (t.appearance || {}).mode || 'system';
                            var stored = null;
                            try { stored = window.localStorage.getItem('aurora:color-scheme'); } catch (e) {}
                            var dark = stored ? stored === 'dark' : mode === 'dark' ? true : mode === 'light' ? false : !window.matchMedia || !window.matchMedia('(prefers-color-scheme: light)').matches;
                            root.style.colorScheme = dark ? 'dark' : 'light';
                            root.dataset.auroraMode = dark ? 'dark' : 'light';
                            document.body ? null : document.addEventListener('DOMContentLoaded', function () {
                                document.body.style.backgroundColor = dark ? (c.background || '#0b1020') : '#eef1f8';
                            });
                        } catch (e) { /* never break page render for theming */ }
                    })();
                </script>
            @endif
        @show

        @yield('assets')

        @include('layouts.scripts')
    </head>
    <body class="{{ $css['body'] ?? 'bg-neutral-50' }}">
        @section('content')
            @yield('above-container')
            @yield('container')
            @yield('below-container')
        @show
        @section('scripts')
            {!! $asset->js('main.js') !!}
        @show
    </body>
</html>
