<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'nombre' => 'TestAdmin',
            'email' => 'testadmin@cursus.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        User::create([
            'nombre' => 'TestUser',
            'email' => 'Testuser@cursus.com',
            'password' => Hash::make('user123'),
            'role' => 'general',
        ]);
    }
}