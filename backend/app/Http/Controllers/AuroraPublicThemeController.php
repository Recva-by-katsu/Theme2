<?php

namespace Pterodactyl\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Services\AuroraThemeService;

/**
 * Public theme config endpoint: GET /aurora/theme.json
 *
 * Reachable for guests (login page theming) and authenticated users. Only
 * exposes presentation settings — never user, server, or secret data.
 */
class AuroraPublicThemeController extends Controller
{
    public function __construct(private AuroraThemeService $themes)
    {
    }

    public function show(): JsonResponse
    {
        return response()
            ->json($this->themes->publicConfig())
            ->header('Cache-Control', 'public, max-age=60');
    }
}
