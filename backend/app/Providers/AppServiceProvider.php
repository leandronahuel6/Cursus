<?php

namespace App\Providers;

use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        View::composer('*', function ($view) {
            $user = auth()->user();
            $fullName = trim((string) ($user?->nombre ?? ''));
            $nameParts = preg_split('/\s+/', $fullName, -1, PREG_SPLIT_NO_EMPTY) ?: [];
            $initials = collect($nameParts)
                ->take(2)
                ->map(fn (string $part) => mb_substr($part, 0, 1))
                ->implode('');

            $view->with([
                'viewerFullName' => $fullName !== '' ? $fullName : null,
                'viewerFirstName' => $nameParts[0] ?? null,
                'viewerLegajo' => $user?->legajo,
                'viewerInitials' => $initials !== '' ? mb_strtoupper($initials) : null,
            ]);
        });
    }
}
