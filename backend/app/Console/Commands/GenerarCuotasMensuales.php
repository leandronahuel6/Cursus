<?php

namespace App\Console\Commands;

use App\Services\CuotaMensualService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('cuotas:generar-mensuales')]
#[Description('Genera la fila de cuota "pendiente" del período actual para todos los alumnos (no hace nada en enero/febrero).')]
class GenerarCuotasMensuales extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $creados = CuotaMensualService::generarParaTodosLosAlumnos();

        $this->info("Cuotas generadas: {$creados}");
    }
}
