<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Carrera;

class CarrerasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Carrera::create([
            'nombre' => 'Tecnicatura Universitaria en Programación'
        ]);

        Carrera::create([
            'nombre' => 'Ingenieria Industrial'
        ]);
    }
}
