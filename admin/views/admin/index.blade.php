@extends('layouts.admin')

@section('title')
    Administration
@endsection

@section('content-header')
    <h1>Administrative Overview<small>A quick glance at your system.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Index</li>
    </ol>
@endsection

@section('content')
@php
    // Real statistics, resolved defensively (works even if the controller
    // patch was skipped — the service is the fallback, never fake data).
    try {
        $stats = $auroraStats ?? \Pterodactyl\Services\AuroraThemeService::dashboardStats();
    } catch (\Throwable $e) {
        $stats = ['users' => 0, 'servers' => 0, 'nodes' => 0, 'locations' => 0, 'nests' => 0, 'databases' => 0, 'suspended' => 0, 'allocationsUsed' => 0, 'allocationsTotal' => 0, 'recentServers' => [], 'nodeHealth' => []];
    }
@endphp
<div class="row aurora-stat-row">
    <div class="col-lg-3 col-sm-6 col-xs-12">
        <a href="{{ route('admin.servers') }}" class="aurora-stat-card">
            <span class="aurora-stat-icon" style="color: var(--aurora-primary); background: rgba(79,124,255,.14);"><i class="fa fa-server"></i></span>
            <span class="aurora-stat-body">
                <span class="aurora-stat-value">{{ number_format($stats['servers']) }}</span>
                <span class="aurora-stat-label">Servers</span>
            </span>
        </a>
    </div>
    <div class="col-lg-3 col-sm-6 col-xs-12">
        <a href="{{ route('admin.users') }}" class="aurora-stat-card">
            <span class="aurora-stat-icon" style="color: var(--aurora-info); background: rgba(56,189,248,.14);"><i class="fa fa-users"></i></span>
            <span class="aurora-stat-body">
                <span class="aurora-stat-value">{{ number_format($stats['users']) }}</span>
                <span class="aurora-stat-label">Users</span>
            </span>
        </a>
    </div>
    <div class="col-lg-3 col-sm-6 col-xs-12">
        <a href="{{ route('admin.nodes') }}" class="aurora-stat-card">
            <span class="aurora-stat-icon" style="color: var(--aurora-success); background: rgba(34,197,94,.14);"><i class="fa fa-sitemap"></i></span>
            <span class="aurora-stat-body">
                <span class="aurora-stat-value">{{ number_format($stats['nodes']) }}</span>
                <span class="aurora-stat-label">Nodes</span>
            </span>
        </a>
    </div>
    <div class="col-lg-3 col-sm-6 col-xs-12">
        <a href="{{ route('admin.locations') }}" class="aurora-stat-card">
            <span class="aurora-stat-icon" style="color: var(--aurora-warning); background: rgba(245,158,11,.16);"><i class="fa fa-globe"></i></span>
            <span class="aurora-stat-body">
                <span class="aurora-stat-value">{{ number_format($stats['locations']) }}</span>
                <span class="aurora-stat-label">Locations</span>
            </span>
        </a>
    </div>
</div>

<div class="row">
    <div class="col-xs-12">
        <div class="box aurora-box
            @if($version->isLatestPanel())
                box-success
            @else
                box-danger
            @endif
        ">
            <div class="box-header with-border">
                <h3 class="box-title">System Information</h3>
            </div>
            <div class="box-body">
                @if ($version->isLatestPanel())
                    You are running Pterodactyl Panel version <code>{{ config('app.version') }}</code>. Your panel is up-to-date!
                @else
                    Your panel is <strong>not up-to-date!</strong> The latest version is <a href="https://github.com/Pterodactyl/Panel/releases/v{{ $version->getPanel() }}" target="_blank"><code>{{ $version->getPanel() }}</code></a> and you are currently running version <code>{{ config('app.version') }}</code>.
                @endif
                <div class="aurora-sys-grid">
                    <span><i class="fa fa-database"></i> {{ number_format($stats['databases']) }} databases</span>
                    <span><i class="fa fa-th-large"></i> {{ number_format($stats['nests']) }} nests</span>
                    <span><i class="fa fa-ban"></i> {{ number_format($stats['suspended']) }} suspended servers</span>
                    <span><i class="fa fa-plug"></i> {{ number_format($stats['allocationsUsed']) }} / {{ number_format($stats['allocationsTotal']) }} allocations used</span>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-7 col-xs-12">
        <div class="box aurora-box">
            <div class="box-header with-border">
                <h3 class="box-title">Recently Created Servers</h3>
                <div class="box-tools pull-right">
                    <a href="{{ route('admin.servers') }}" class="btn btn-sm aurora-btn-ghost">View all</a>
                </div>
            </div>
            <div class="box-body no-padding">
                @if(count($stats['recentServers']) > 0)
                    <table class="table table-hover aurora-table">
                        <thead>
                            <tr><th>Server</th><th>Owner</th><th>Status</th><th class="text-right">Created</th></tr>
                        </thead>
                        <tbody>
                            @foreach($stats['recentServers'] as $server)
                                <tr>
                                    <td><a href="{{ route('admin.servers.view', $server['id']) }}">{{ $server['name'] }}</a></td>
                                    <td>{{ $server['owner'] }}</td>
                                    <td>
                                        @if($server['status'] === 'suspended')
                                            <span class="label aurora-label-danger">Suspended</span>
                                        @elseif(in_array($server['status'], ['installing', 'restoring_backup', 'transferring']))
                                            <span class="label aurora-label-info">{{ ucfirst(str_replace('_', ' ', $server['status'])) }}</span>
                                        @else
                                            <span class="label aurora-label-success">Active</span>
                                        @endif
                                    </td>
                                    <td class="text-right text-muted">{{ $server['created'] }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @else
                    <p class="aurora-empty-note">No servers exist yet. <a href="{{ route('admin.servers.new') }}">Create your first server</a>.</p>
                @endif
            </div>
        </div>
    </div>
    <div class="col-md-5 col-xs-12">
        <div class="box aurora-box">
            <div class="box-header with-border">
                <h3 class="box-title">Node Health</h3>
                <div class="box-tools pull-right">
                    <a href="{{ route('admin.nodes') }}" class="btn btn-sm aurora-btn-ghost">View all</a>
                </div>
            </div>
            <div class="box-body no-padding">
                @if(count($stats['nodeHealth']) > 0)
                    <table class="table table-hover aurora-table">
                        <thead>
                            <tr><th>Node</th><th class="text-center">Servers</th><th class="text-right">State</th></tr>
                        </thead>
                        <tbody>
                            @foreach($stats['nodeHealth'] as $node)
                                <tr>
                                    <td><a href="{{ route('admin.nodes.view', $node['id']) }}">{{ $node['name'] }}</a></td>
                                    <td class="text-center">{{ $node['servers'] }}</td>
                                    <td class="text-right">
                                        @if($node['maintenance'])
                                            <span class="label aurora-label-warning">Maintenance</span>
                                        @else
                                            <span class="label aurora-label-success">Online</span>
                                        @endif
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @else
                    <p class="aurora-empty-note">No nodes configured yet. <a href="{{ route('admin.nodes.new') }}">Add a node</a>.</p>
                @endif
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-xs-6 col-sm-3 text-center">
        <a href="{{ $version->getDiscord() }}" class="btn aurora-btn-block btn-warning"><i class="fa fa-fw fa-support"></i> Get Help <small>(via Discord)</small></a>
    </div>
    <div class="col-xs-6 col-sm-3 text-center">
        <a href="https://pterodactyl.io" class="btn aurora-btn-block btn-primary"><i class="fa fa-fw fa-link"></i> Documentation</a>
    </div>
    <div class="clearfix visible-xs-block">&nbsp;</div>
    <div class="col-xs-6 col-sm-3 text-center">
        <a href="https://github.com/pterodactyl/panel" class="btn aurora-btn-block btn-primary"><i class="fa fa-fw fa-github"></i> GitHub</a>
    </div>
    <div class="col-xs-6 col-sm-3 text-center">
        <a href="{{ $version->getDonations() }}" class="btn aurora-btn-block btn-success"><i class="fa fa-fw fa-money"></i> Support the Project</a>
    </div>
</div>
@endsection
