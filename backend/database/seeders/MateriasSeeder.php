<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Carrera;
use App\Models\Materia;
use App\Models\Correlatividad;

class MateriasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $carrera = Carrera::where('nombre', 'Tecnicatura Universitaria en Programación')->first();

        // Permite re-correr el seeder sin duplicar ni dejar IDs salteados.
        $materiaIdsExistentes = Materia::where('carrera_id', $carrera->id)->pluck('id');
        Correlatividad::whereIn('materia_id', $materiaIdsExistentes)
            ->orWhereIn('requisito_id', $materiaIdsExistentes)
            ->delete();
        Materia::where('carrera_id', $carrera->id)->delete();

        // Numeración según Ordenanza N° 2019 - Anexo I (Plan 2024)
        $materias = [
            1 => ['nombre' => 'Programación I', 'nivel' => 1],
            2 => ['nombre' => 'Arquitectura y Sistemas Operativos', 'nivel' => 1],
            3 => ['nombre' => 'Matemática', 'nivel' => 1],
            4 => ['nombre' => 'Organización Empresarial', 'nivel' => 1],
            5 => ['nombre' => 'Programación II', 'nivel' => 1],
            6 => ['nombre' => 'Probabilidad y Estadística', 'nivel' => 1],
            7 => ['nombre' => 'Base de Datos I', 'nivel' => 1],
            8 => ['nombre' => 'Inglés I', 'nivel' => 1],
            9 => ['nombre' => 'Programación III', 'nivel' => 2],
            10 => ['nombre' => 'Base de Datos II', 'nivel' => 2],
            11 => ['nombre' => 'Metodología de Sistemas I', 'nivel' => 2],
            12 => ['nombre' => 'Inglés II', 'nivel' => 2],
            13 => ['nombre' => 'Programación IV', 'nivel' => 2],
            14 => ['nombre' => 'Metodología de Sistemas II', 'nivel' => 2],
            15 => ['nombre' => 'Introducción al Análisis de Datos', 'nivel' => 2],
            16 => ['nombre' => 'Legislación', 'nivel' => 2],
            17 => ['nombre' => 'Gestión de Desarrollo de Software', 'nivel' => 2],
            18 => ['nombre' => 'Trabajo Final Integrador', 'nivel' => 2],
        ];

        $ids = [];
        foreach ($materias as $numero => $datos) {
            $ids[$numero] = Materia::create([
                'carrera_id' => $carrera->id,
                'nombre' => $datos['nombre'],
                'nivel' => $datos['nivel'],
            ])->id;
        }

        // requisitos 'cursadas' -> condicion 'regular' | 'aprobadas' -> condicion 'aprobada'
        $correlatividades = [
            5 => ['regular' => [1, 2]],
            6 => ['regular' => [3]],
            7 => ['regular' => [1, 3]],
            9 => ['regular' => [5, 7], 'aprobada' => [1]],
            10 => ['regular' => [7], 'aprobada' => [1]],
            11 => ['regular' => [5, 7], 'aprobada' => [1, 4]],
            12 => ['regular' => [8]],
            13 => ['regular' => [9, 10, 11], 'aprobada' => [5, 7]],
            14 => ['regular' => [11], 'aprobada' => [4]],
            15 => ['regular' => [10], 'aprobada' => [6, 7]],
            16 => ['regular' => [7], 'aprobada' => [4]],
            17 => ['regular' => [9, 10], 'aprobada' => [5, 7]],
            // Para iniciar el TFI piden cursadas 8, 9, 10, 11 y 12, pero como para acreditarlo
            // se exigen las 17 materias aprobadas, esa condición (más estricta) absorbe a la anterior.
            18 => ['aprobada' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]],
        ];

        foreach ($correlatividades as $materiaNumero => $condiciones) {
            foreach ($condiciones as $condicion => $requisitos) {
                foreach ($requisitos as $requisitoNumero) {
                    Correlatividad::create([
                        'materia_id' => $ids[$materiaNumero],
                        'requisito_id' => $ids[$requisitoNumero],
                        'condicion_requerida' => $condicion,
                    ]);
                }
            }
        }
    }
}
