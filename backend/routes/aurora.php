<?php

/*
|--------------------------------------------------------------------------
| Aurora Theme — public routes
|--------------------------------------------------------------------------
|
| This file is registered by the installer with a small marked insertion in
| app/Providers/RouteServiceProvider.php (fully reversible on uninstall).
|
| The theme config endpoint MUST be reachable for both guests (login page
| theming) and authenticated users, which is why it lives outside the
| auth/guest middleware groups. It only exposes presentation settings —
| never secrets, user data, or server data.
|
*/

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\AuroraPublicThemeController;

Route::get('/aurora/theme.json', [AuroraPublicThemeController::class, 'show'])
    ->name('aurora.theme.config');
