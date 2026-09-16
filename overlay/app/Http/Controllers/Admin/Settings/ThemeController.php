<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\Settings\ThemeSettingsFormRequest;
use Pterodactyl\Services\Themes\ThemeSettingsService;

class ThemeController extends Controller
{
    public function __construct(
        private AlertsMessageBag $alert,
        private ThemeSettingsService $themeSettings,
    ) {
    }

    public function index(): View
    {
        return view('admin.settings.theme', [
            'theme' => $this->themeSettings->get(),
            'presets' => $this->themeSettings->presets(),
        ]);
    }

    public function update(ThemeSettingsFormRequest $request): RedirectResponse
    {
        $this->themeSettings->save($request->validated()['theme']);

        $this->alert->success('Theme settings have been updated. Refresh client pages to apply the latest branding tokens.')->flash();

        return redirect()->route('admin.settings.theme');
    }

    public function reset(): RedirectResponse
    {
        $this->themeSettings->reset();
        $this->alert->success('Theme settings were reset to defaults.')->flash();

        return redirect()->route('admin.settings.theme');
    }
}
