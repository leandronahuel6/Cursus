<?php

namespace App\Http\Controllers;

use App\Models\PagoCuota;
use App\Services\ComprobanteAnalyzer;
use App\Services\CuotaMensualService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PagoCuotaController extends Controller
{
    // Estado de la cuota del período más reciente del ciclo (marzo-diciembre).
    // Genera la fila 'pendiente' al vuelo si todavía no existe, por si el
    // comando mensual no llegó a correr.
    public function estado(Request $request)
    {
        $usuario = $request->user();
        CuotaMensualService::generarFaltantesParaUsuario($usuario);

        $periodos = CuotaMensualService::periodosCicloHastaHoy();
        $periodo = end($periodos);

        $pago = PagoCuota::where('usuario_id', $usuario->id)
            ->where('periodo', $periodo)
            ->first();

        $esPeriodoActual = $periodo === now()->format('Y-m');

        return response()->json([
            'periodo' => $periodo,
            'pagado' => $pago?->estado === 'pagado',
            'fecha_pago' => $pago?->fecha_pago?->toDateString(),
            'dias_para_vencimiento' => $esPeriodoActual ? 15 - now()->day : null,
        ]);
    }

    // Historial del alumno autenticado, mes a mes, de UN ciclo (año) por vez —
    // por default el actual, para no mostrarle de entrada 30 meses acumulados
    // a alumnos con varios años de cursada. `?anio=2024` para ver otro ciclo.
    public function historial(Request $request)
    {
        $usuario = $request->user();
        CuotaMensualService::generarFaltantesParaUsuario($usuario);

        $anio = (int) $request->query('anio', CuotaMensualService::anioCicloActual());

        $pagos = PagoCuota::where('usuario_id', $usuario->id)
            ->where('periodo', 'like', "{$anio}-%")
            ->orderBy('periodo')
            ->get();

        return response()->json([
            'anio' => $anio,
            'anios_disponibles' => CuotaMensualService::aniosConCuotas($usuario->id),
            'cuotas' => $pagos->map(fn (PagoCuota $p) => [
                'id' => $p->id,
                'periodo' => $p->periodo,
                'estado' => $p->estado,
                'medio_pago' => $p->medio_pago,
                'monto_base' => $p->monto_base,
                'monto_exigible' => $p->monto_exigible,
                'monto_declarado' => $p->monto_declarado,
                'fecha_pago' => $p->fecha_pago?->toDateString(),
                'tiene_comprobante' => $p->comprobante_path !== null,
            ]),
        ]);
    }

    // Sube el comprobante de un período puntual. Gemini primero clasifica si
    // el archivo es siquiera un comprobante real (si no lo es, se rechaza la
    // subida) y extrae monto/fecha. El recargo del 10% se calcula sobre la
    // fecha que la IA leyó EN el comprobante (la fecha real del pago), no
    // sobre la fecha que haya tipeado el alumno — esa queda solo como
    // respaldo si la IA no pudo leer ninguna fecha.
    public function subirComprobante(Request $request, string $periodo)
    {
        $request->validate([
            'comprobante' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $usuario = $request->user();

        $pago = PagoCuota::where('usuario_id', $usuario->id)
            ->where('periodo', $periodo)
            ->first();

        if (!$pago) {
            return response()->json(['message' => 'No existe una cuota para ese período.'], 404);
        }

        $file = $request->file('comprobante');
        $extension = strtolower($file->getClientOriginalExtension());

        // El análisis con Gemini lee el archivo temporal ANTES de moverlo a
        // storage con store(), que lo relocaliza y deja el path original inválido.
        // El alumno ya pagó en la realidad (por eso tiene el comprobante) —
        // si la IA no está disponible ahora mismo, no se acepta a ciegas con
        // una fecha adivinada: se le pide reintentar o hablar con secretaría.
        $datosIA = ComprobanteAnalyzer::analizar($file, $extension);

        if ($datosIA === null) {
            return response()->json([
                'message' => 'No pudimos validar el comprobante en este momento. Probá de nuevo en unos minutos o comunicate con la secretaría si el problema persiste.',
            ], 503);
        }

        if (($datosIA['es_comprobante_valido'] ?? null) === false) {
            return response()->json(['message' => 'No es un comprobante de pago válido o no se pudo leer.'], 422);
        }

        if (empty($datosIA['fecha'])) {
            return response()->json(['message' => 'No pudimos leer la fecha del comprobante. Enviá una foto o PDF con mejor calidad, donde se vea clara la fecha.'], 422);
        }

        if (!$this->fechaCorrespondeAlPeriodo($datosIA, $periodo)) {
            return response()->json(['message' => 'La fecha del comprobante no corresponde al período que estás pagando.'], 422);
        }

        $fechaPago = $this->resolverFechaPago($datosIA, null);

        $montoBase = $pago->monto_base ?? CuotaMensualService::montoBaseParaUsuario($usuario);
        $montoExigible = $montoBase !== null
            ? CuotaMensualService::calcularMontoExigible((float) $montoBase, $fechaPago)
            : null;

        $datosIA['coincide_monto'] = ComprobanteAnalyzer::compararMonto($datosIA['monto'] ?? null, $montoExigible);

        if ($pago->comprobante_path) {
            Storage::disk('local')->delete($pago->comprobante_path);
        }

        $path = $file->store("comprobantes/{$usuario->id}", 'local');

        $pago->update([
            'estado' => 'pagado',
            'medio_pago' => 'transferencia',
            'fecha_pago' => $fechaPago->toDateString(),
            'monto_base' => $montoBase,
            'monto_exigible' => $montoExigible,
            'monto_declarado' => $datosIA['monto'] ?? null,
            'comprobante_path' => $path,
            'comprobante_mime' => $file->getClientMimeType(),
            'datos_extraidos_ia' => $datosIA,
        ]);

        return response()->json([
            'periodo' => $pago->periodo,
            'estado' => $pago->estado,
            'monto_exigible' => $pago->monto_exigible,
            'monto_declarado' => $pago->monto_declarado,
            'datos_extraidos_ia' => $pago->datos_extraidos_ia,
        ]);
    }

    // Fecha real a usar para calcular el recargo: prioriza la que la IA leyó
    // en el comprobante; si no pudo leerla (o Gemini no está disponible),
    // cae a la fecha que declaró el alumno, y si tampoco hay, a hoy.
    private function resolverFechaPago(?array $datosIA, ?string $fechaDeclarada): \Carbon\Carbon
    {
        $fechaExtraida = $datosIA['fecha'] ?? null;
        if ($fechaExtraida) {
            try {
                return \Carbon\Carbon::parse($fechaExtraida);
            } catch (\Exception $e) {
                // fecha ilegible/mal formada, seguimos con el respaldo
            }
        }

        return $fechaDeclarada ? \Carbon\Carbon::parse($fechaDeclarada) : now();
    }

    // Verifica que la fecha que la IA leyó en el comprobante sea plausible
    // para el período que se está pagando (con un mes de tolerancia para
    // pagos hechos unos días antes o después del mes exacto). Si no hay
    // fecha extraída, no hay nada que comparar y se deja pasar.
    private function fechaCorrespondeAlPeriodo(array $datosIA, string $periodo): bool
    {
        $fechaExtraida = $datosIA['fecha'] ?? null;
        if (!$fechaExtraida) {
            return true;
        }

        try {
            $fecha = \Carbon\Carbon::parse($fechaExtraida);
            $inicioPeriodo = \Carbon\Carbon::createFromFormat('Y-m', $periodo)->startOfMonth();
        } catch (\Exception $e) {
            return true;
        }

        return $fecha->diffInMonths($inicioPeriodo) <= 1;
    }

    // Declara un pago en efectivo hecho en tesorería. A diferencia de una
    // transferencia, el recibo lo emite la propia universidad, no un tercero
    // independiente — no hay nada contra qué corroborarlo. Por eso esto nunca
    // pasa a 'pagado' solo: queda en 'pendiente_efectivo' hasta que la
    // secretaría lo confirme manualmente contra el informe de tesorería.
    public function declararEfectivo(Request $request, string $periodo)
    {
        $request->validate([
            'recibo' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $usuario = $request->user();

        $pago = PagoCuota::where('usuario_id', $usuario->id)
            ->where('periodo', $periodo)
            ->first();

        if (!$pago) {
            return response()->json(['message' => 'No existe una cuota para ese período.'], 404);
        }

        $file = $request->file('recibo');
        $extension = strtolower($file->getClientOriginalExtension());

        // El alumno ya pagó en tesorería (por eso tiene el recibo) — si la
        // IA no está disponible ahora, no se acepta a ciegas.
        $datosIA = ComprobanteAnalyzer::analizar($file, $extension);

        if ($datosIA === null) {
            return response()->json([
                'message' => 'No pudimos validar el recibo en este momento. Probá de nuevo en unos minutos o comunicate con la secretaría si el problema persiste.',
            ], 503);
        }

        if (($datosIA['es_comprobante_valido'] ?? null) === false) {
            return response()->json(['message' => 'No es un comprobante de pago válido o no se pudo leer.'], 422);
        }

        if (empty($datosIA['fecha'])) {
            return response()->json(['message' => 'No pudimos leer la fecha del recibo. Enviá una foto o PDF con mejor calidad, donde se vea clara la fecha.'], 422);
        }

        if (!$this->fechaCorrespondeAlPeriodo($datosIA, $periodo)) {
            return response()->json(['message' => 'La fecha del recibo no corresponde al período que estás pagando.'], 422);
        }

        if ($pago->comprobante_path) {
            Storage::disk('local')->delete($pago->comprobante_path);
        }

        $path = $file->store("comprobantes/{$usuario->id}", 'local');
        $mime = $file->getClientMimeType();

        $fechaPago = $this->resolverFechaPago($datosIA, null);

        $montoBase = $pago->monto_base ?? CuotaMensualService::montoBaseParaUsuario($usuario);
        $montoExigible = $montoBase !== null
            ? CuotaMensualService::calcularMontoExigible((float) $montoBase, $fechaPago)
            : null;

        $datosIA['coincide_monto'] = ComprobanteAnalyzer::compararMonto($datosIA['monto'] ?? null, $montoExigible);

        $pago->update([
            'estado' => 'pendiente_efectivo',
            'medio_pago' => 'efectivo',
            'fecha_pago' => $fechaPago->toDateString(),
            'monto_base' => $montoBase,
            'monto_exigible' => $montoExigible,
            'monto_declarado' => $datosIA['monto'] ?? null,
            'comprobante_path' => $path,
            'comprobante_mime' => $mime,
            'datos_extraidos_ia' => $datosIA,
        ]);

        return response()->json([
            'periodo' => $pago->periodo,
            'estado' => $pago->estado,
            'medio_pago' => $pago->medio_pago,
            'monto_exigible' => $pago->monto_exigible,
        ]);
    }

    // Sirve al propio alumno el archivo que subió (comprobante o recibo),
    // para que pueda revisar qué cargó. Solo el dueño del registro puede verlo.
    public function comprobante(Request $request, int $id)
    {
        $pago = PagoCuota::where('id', $id)
            ->where('usuario_id', $request->user()->id)
            ->first();

        if (!$pago || !$pago->comprobante_path || !Storage::disk('local')->exists($pago->comprobante_path)) {
            return response()->json(['message' => 'Comprobante no encontrado.'], 404);
        }

        return Storage::disk('local')->response($pago->comprobante_path);
    }
}
