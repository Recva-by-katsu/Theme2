<?php

namespace Pterodactyl\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Pterodactyl\Services\AuroraThemeService;

class AuroraThemeCommand extends Command
{
    protected $signature = 'aurora:theme
                            {--verify : Verify the theme installation (table, config, routes)}
                            {--reset : Reset the theme configuration to defaults}
                            {--force : Skip confirmation for destructive actions}';

    protected $description = 'Manage the Aurora panel theme (verify / reset).';

    public function handle(AuroraThemeService $themes): int
    {
        if ($this->option('reset')) {
            if (!$this->option('force') && !$this->confirm('Reset ALL Aurora theme settings to defaults?')) {
                $this->info('Aborted.');

                return 0;
            }
            $themes->reset();
            $this->info('Aurora theme settings have been reset to defaults.');

            return 0;
        }

        if ($this->option('verify')) {
            $ok = true;

            if (!Schema::hasTable('aurora_theme_settings')) {
                $this->error('Missing table: aurora_theme_settings (migrations did not run).');
                $ok = false;
            } else {
                $this->info('Table aurora_theme_settings: OK');
            }

            try {
                $config = $themes->get();
                if (empty($config['colors']['primary'])) {
                    throw new \RuntimeException('Resolved config is missing color tokens.');
                }
                $this->info('Theme config resolves: OK');
            } catch (\Throwable $e) {
                $this->error('Theme config failed to resolve: ' . $e->getMessage());
                $ok = false;
            }

            foreach (['admin.aurora-theme', 'aurora.theme.config'] as $route) {
                if (\Route::has($route)) {
                    $this->info("Route {$route}: OK");
                } else {
                    $this->error("Route {$route}: NOT REGISTERED");
                    $ok = false;
                }
            }

            $this->info('Aurora theme version: ' . AuroraThemeService::VERSION);

            return $ok ? 0 : 1;
        }

        $this->info('Aurora theme v' . AuroraThemeService::VERSION);
        $this->line('Usage: php artisan aurora:theme [--verify] [--reset --force]');

        return 0;
    }
}
