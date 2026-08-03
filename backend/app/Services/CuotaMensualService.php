<?php

namespace App\Services;

use App\Models\Cuota;
use App\Models\PagoCuota;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Centraliza las reglas del ciclo de cuotas (marzo-diciembre, sin enero/febrero)
 * para que el comando programado y el fallback "lazy" de los controllers generen
 * exactamente las mismas filas.
 */
class CuotaMensualService
{
    // El ciclo de cobro de un año corre de marzo a diciembre. Enero y febrero
    // pertenecen al receso del ciclo del año anterior, no generan cuota.
    public static function anioCicloActual(): int
    {
        $ahora = now();

        return $ahora->month >= 3 ? $ahora->year : $ahora->year - 1;
    }

    // Períodos 'YYYY-MM' desde marzo del ciclo actual hasta el mes de hoy
    // (o hasta diciembre completo si hoy ya es enero/febrero del año siguiente,
    // es decir el ciclo ya cerró por completo).
    public static function periodosCicloHastaHoy(): array
    {
        $anio = self::anioCicloActual();
        $ahora = now();
        $mesFinal = $ahora->year === $anio ? min($ahora->month, 12) : 12;

        $periodos = [];
        for ($mes = 3; $mes <= $mesFinal; $mes++) {
            $periodos[] = sprintf('%d-%02d', $anio, $mes);
        }

        return $periodos;
    }

    public static function carreraIdDeUsuario(int $usuarioId): ?int
    {
        return DB::table('carrera_usuario')->where('usuario_id', $usuarioId)->value('carrera_id');
    }

    public static function montoBaseParaUsuario(User $usuario): ?float
    {
        $carreraId = self::carreraIdDeUsuario($usuario->id);
        if (!$carreraId) {
            return null;
        }

        return self::montoBaseParaPeriodo($carreraId, now()->format('Y-m'));
    }

    // Precio vigente al ARRANCAR un período puntual (no "hoy"), para que cada
    // mes conserve su propio precio y no se vea arrastrado por un aumento
    // posterior mientras siga sin pagarse. Ej: si julio y agosto costaban
    // $88.000 y en septiembre sube a $96.000, julio/agosto impagos deben
    // seguir mostrando $88.000, no saltar a $96.000 solo por seguir pendientes.
    public static function montoBaseParaPeriodo(int $carreraId, string $periodo): ?float
    {
        $inicioPeriodo = Carbon::createFromFormat('Y-m', $periodo)->startOfMonth()->toDateString();

        $cuota = Cuota::where('carrera_id', $carreraId)
            ->where('vigente_desde', '<=', $inicioPeriodo)
            ->orderBy('vigente_desde', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        return $cuota?->valor_mensual;
    }

    // Calcula el monto exigible para un pago hecho en $fechaPago: normal del 1
    // al 15, +10% de recargo (plano, sin importar cuántos meses de atraso) desde el 16.
    public static function calcularMontoExigible(float $montoBase, Carbon $fechaPago): float
    {
        return $fechaPago->day <= 15 ? $montoBase : round($montoBase * 1.10, 2);
    }

    // Crea las filas 'pendiente' que falten para un usuario dentro del ciclo actual.
    // Cada período que se genera toma el precio que estaba vigente AL ARRANCAR
    // ese mes puntual (no el de hoy) — importante para alumnos que no entran
    // seguido y de golpe les faltan generar varios meses de una vez, cada uno
    // con su propio precio si hubo aumentos en el medio.
    public static function generarFaltantesParaUsuario(User $usuario): void
    {
        $periodos = self::periodosCicloHastaHoy();
        if (empty($periodos)) {
            return;
        }

        $carreraId = self::carreraIdDeUsuario($usuario->id);
        $existentes = PagoCuota::where('usuario_id', $usuario->id)
            ->whereIn('periodo', $periodos)
            ->pluck('periodo')
            ->all();

        foreach (array_diff($periodos, $existentes) as $periodo) {
            $montoBase = $carreraId ? self::montoBaseParaPeriodo($carreraId, $periodo) : null;
            PagoCuota::firstOrCreate(
                ['usuario_id' => $usuario->id, 'periodo' => $periodo],
                ['estado' => 'pendiente', 'monto_base' => $montoBase]
            );
        }
    }

    // Recalcula monto_base de las filas 'pendiente' (todavía sin pagar) de una
    // carrera cuando se agrega/edita un precio, para que el historial del
    // alumno no quede mostrando un precio viejo. Cada fila se recalcula con el
    // precio vigente AL ARRANCAR SU PROPIO período — no el de hoy — para que un
    // aumento de precio no arrastre hacia arriba a meses anteriores que
    // quedaron impagos (esos deben seguir costando lo que costaban ellos).
    // Las filas ya efectivizadas (pagado / pendiente_efectivo) no se tocan:
    // ya tienen su monto_base snapshoteado al momento real del pago.
    public static function resincronizarPendientesParaCarrera(int $carreraId): int
    {
        $usuarioIds = DB::table('carrera_usuario')->where('carrera_id', $carreraId)->pluck('usuario_id');

        $pendientes = PagoCuota::whereIn('usuario_id', $usuarioIds)
            ->where('estado', 'pendiente')
            ->get(['id', 'periodo']);

        $precioPorPeriodo = [];
        $actualizados = 0;

        foreach ($pendientes as $pago) {
            if (!array_key_exists($pago->periodo, $precioPorPeriodo)) {
                $precioPorPeriodo[$pago->periodo] = self::montoBaseParaPeriodo($carreraId, $pago->periodo);
            }

            $pago->monto_base = $precioPorPeriodo[$pago->periodo];
            $pago->save();
            $actualizados++;
        }

        return $actualizados;
    }

    // Años (ciclos) para los que un usuario tiene al menos una fila de cuota,
    // más recientes primero. Sirve para armar el selector de "ver años
    // anteriores" en el historial, sin tener que traer todas las filas.
    public static function aniosConCuotas(int $usuarioId): array
    {
        return PagoCuota::where('usuario_id', $usuarioId)
            ->selectRaw('DISTINCT SUBSTRING(periodo, 1, 4) as anio')
            ->orderByDesc('anio')
            ->pluck('anio')
            ->map(fn ($anio) => (int) $anio)
            ->values()
            ->all();
    }

    // Usado por el comando mensual: genera la fila del período actual para todos
    // los alumnos activos. No hace nada si estamos en enero/febrero.
    public static function generarParaTodosLosAlumnos(): int
    {
        $periodos = self::periodosCicloHastaHoy();
        if (empty($periodos)) {
            return 0;
        }

        $periodoActual = end($periodos);
        $creados = 0;

        User::where('role', 'general')->chunk(200, function ($usuarios) use ($periodoActual, &$creados) {
            foreach ($usuarios as $usuario) {
                $montoBase = self::montoBaseParaUsuario($usuario);
                $pago = PagoCuota::firstOrCreate(
                    ['usuario_id' => $usuario->id, 'periodo' => $periodoActual],
                    ['estado' => 'pendiente', 'monto_base' => $montoBase]
                );
                if ($pago->wasRecentlyCreated) {
                    $creados++;
                }
            }
        });

        return $creados;
    }
}
