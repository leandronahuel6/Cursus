<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Cuota;
use App\Models\Carrera;
use App\Models\Materia;
use App\Models\PagoCuota;
use App\Models\SesionPomodoro;
use App\Services\CuotaMensualService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    public function listarAlumnos()
    {
        $alumnos = User::where('role', 'general')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'legajo', 'email']);

        return response()->json($alumnos);
    }

    public function buscarAlumno(Request $request)
    {
        $request->validate(['legajo' => 'required|string']);

        $usuario = User::where('legajo', $request->legajo)
            ->where('role', 'general')
            ->first();

        if (!$usuario) {
            return response()->json(['message' => 'Alumno no encontrado.'], 404);
        }

        // Materias con notas
        $materias = \App\Models\MateriaUsuario::with(['materia', 'notas'])
            ->where('usuario_id', $usuario->id)
            ->get()
            ->map(function ($mu) {
                $notas = $mu->notas->pluck('valor');
                return [
                    'nombre'        => $mu->materia->nombre,
                    'nivel'         => $mu->materia->nivel,
                    'estado'        => $mu->estado_historico,
                    'nota_promedio' => $notas->count() ? round($notas->avg(), 1) : null,
                ];
            });

        // Horas Pomodoro
        $totalSegundos = SesionPomodoro::where('usuario_id', $usuario->id)->sum('duracion_segundos');

        // Estado cuota del mes actual
        $periodoActual = now()->format('Y-m');
        $pagoActual = PagoCuota::where('usuario_id', $usuario->id)
            ->where('periodo', $periodoActual)
            ->first();

        // Resumen materias
        $aprobadas  = $materias->where('estado', 'aprobada')->count();
        $cursando   = $materias->where('estado', 'cursando')->count();
        $regulares  = $materias->where('estado', 'regular')->count();
        $libres     = $materias->where('estado', 'libre')->count();

        return response()->json([
            'usuario' => [
                'id'         => $usuario->id,
                'nombre'     => $usuario->nombre,
                'legajo'     => $usuario->legajo,
                'email'      => $usuario->email,
                'avatar_url' => $usuario->avatar_url,
            ],
            'materias' => $materias->values(),
            'pomodoro' => [
                'total_segundos' => $totalSegundos,
                'total_horas'    => round($totalSegundos / 3600, 1),
            ],
            'cuota_actual' => [
                'periodo'    => $periodoActual,
                'pagado'     => $pagoActual?->estado === 'pagado',
                'fecha_pago' => $pagoActual?->fecha_pago,
            ],
            'resumen' => [
                'total'     => $materias->count(),
                'aprobadas' => $aprobadas,
                'cursando'  => $cursando,
                'regulares' => $regulares,
                'libres'    => $libres,
            ],
        ]);
    }

    public function cuotasEstado()
    {
        $periodoActual = now()->format('Y-m');

        $alumnos = User::where('role', 'general')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'legajo', 'email']);

        $pagos = PagoCuota::where('periodo', $periodoActual)
            ->where('estado', 'pagado')
            ->pluck('fecha_pago', 'usuario_id');

        $data = $alumnos->map(fn($u) => [
            'id'         => $u->id,
            'nombre'     => $u->nombre,
            'legajo'     => $u->legajo,
            'email'      => $u->email,
            'pagado'     => isset($pagos[$u->id]),
            'fecha_pago' => $pagos[$u->id] ?? null,
        ]);

        $hoy          = now()->toDateString();
        $cuotaVigente = Cuota::where('vigente_desde', '<=', $hoy)
                             ->orderBy('vigente_desde', 'desc')
                             ->orderBy('id', 'desc')
                             ->first();
        $cuotaProxima = Cuota::where('vigente_desde', '>', $hoy)
                             ->orderBy('vigente_desde', 'asc')
                             ->orderBy('id', 'desc')
                             ->first();
        $carreras     = Carrera::all(['id', 'nombre']);

        return response()->json([
            'periodo'       => $periodoActual,
            'cuota_vigente' => $cuotaVigente,
            'cuota_proxima' => $cuotaProxima,
            'carreras'      => $carreras,
            'alumnos'       => $data->values(),
            'resumen'       => [
                'total'      => $data->count(),
                'pagaron'    => $data->where('pagado', true)->count(),
                'pendientes' => $data->where('pagado', false)->count(),
            ],
        ]);
    }

    public function setCuota(Request $request)
    {
        $primerDiaMes = now()->startOfMonth()->toDateString();
        $finAnioProximo = now()->addYear()->endOfYear()->toDateString();

        $request->validate([
            'carrera_id'    => 'required|exists:carreras,id',
            'valor_mensual' => 'required|numeric|min:0',
            'vigente_desde' => 'required|date|after_or_equal:' . $primerDiaMes . '|before_or_equal:' . $finAnioProximo,
        ], [
            'vigente_desde.after_or_equal' => 'La fecha de vigencia no puede ser anterior al primer día del mes actual.',
            'vigente_desde.before_or_equal' => 'La fecha de vigencia no puede superar el 31 de diciembre del próximo año.',
        ]);

        $hoy = now()->toDateString();

        // Si la fecha es futura, reemplazar TODAS las cuotas futuras existentes para esa carrera
        if ($request->vigente_desde > $hoy) {
            Cuota::where('carrera_id', $request->carrera_id)
                 ->where('vigente_desde', '>', $hoy)
                 ->delete();
        }

        // updateOrCreate evita duplicados inútiles si se carga una cuota con la misma fecha exacta
        $cuota = Cuota::updateOrCreate(
            [
                'carrera_id'    => $request->carrera_id,
                'vigente_desde' => $request->vigente_desde,
            ],
            [
                'valor_mensual' => $request->valor_mensual,
            ]
        );

        return response()->json($cuota, 201);
    }

    // Historial completo de cuotas de un alumno buscado por legajo (mismo
    // patrón de búsqueda que buscarAlumno). Usado por la secretaría para
    // cotejar contra el informe de tesorería.
    public function historialAlumno(Request $request, string $legajo)
    {
        $usuario = User::where('legajo', $legajo)->where('role', 'general')->first();

        if (!$usuario) {
            return response()->json(['message' => 'Alumno no encontrado.'], 404);
        }

        CuotaMensualService::generarFaltantesParaUsuario($usuario);

        $anio = (int) $request->query('anio', CuotaMensualService::anioCicloActual());

        $pagos = PagoCuota::where('usuario_id', $usuario->id)
            ->where('periodo', 'like', "{$anio}-%")
            ->orderBy('periodo')
            ->get();

        return response()->json([
            'usuario' => [
                'id'     => $usuario->id,
                'nombre' => $usuario->nombre,
                'legajo' => $usuario->legajo,
            ],
            'anio' => $anio,
            'anios_disponibles' => CuotaMensualService::aniosConCuotas($usuario->id),
            'cuotas' => $pagos->map(fn (PagoCuota $p) => [
                'id'                 => $p->id,
                'periodo'            => $p->periodo,
                'estado'             => $p->estado,
                'medio_pago'         => $p->medio_pago,
                'monto_base'         => $p->monto_base,
                'monto_exigible'     => $p->monto_exigible,
                'monto_declarado'    => $p->monto_declarado,
                'fecha_pago'         => $p->fecha_pago?->toDateString(),
                'tiene_comprobante'  => $p->comprobante_path !== null,
                'datos_extraidos_ia' => $p->datos_extraidos_ia,
                'confirmado_en'      => $p->confirmado_en?->toDateTimeString(),
            ]),
        ]);
    }

    // Sirve el archivo del comprobante desde el disco privado. Protegido por
    // el middleware 'admin' ya aplicado a todo este grupo de rutas.
    public function comprobante(int $id)
    {
        $pago = PagoCuota::find($id);

        if (!$pago || !$pago->comprobante_path || !Storage::disk('local')->exists($pago->comprobante_path)) {
            return response()->json(['message' => 'Comprobante no encontrado.'], 404);
        }

        return Storage::disk('local')->response($pago->comprobante_path);
    }

    // Elimina (soft delete) el registro de pago de un período puntual cuando
    // el informe de tesorería contradice lo que el alumno autodeclaró en el
    // sistema. Vuelve el período a 'pendiente' y deja auditoría de quién y
    // por qué; el contacto con el alumno se hace por fuera del sistema.
    public function eliminarPago(Request $request, int $id)
    {
        $request->validate(['motivo' => 'nullable|string|max:255']);

        $pago = PagoCuota::find($id);

        if (!$pago) {
            return response()->json(['message' => 'Registro no encontrado.'], 404);
        }

        // No se hace soft delete de la fila: el rastro de auditoría queda en
        // eliminado_por/motivo_eliminacion sobre la misma fila. Si se borrara
        // (aunque fuera soft delete), el período volvería a intentar
        // regenerarse y chocaría con el índice único (usuario_id, periodo).
        $pago->update([
            'estado'             => 'pendiente',
            'eliminado_por'      => $request->user()->id,
            'motivo_eliminacion' => $request->input('motivo'),
        ]);

        return response()->json(['message' => 'Registro de pago eliminado correctamente.']);
    }

    // Confirma manualmente un pago declarado en efectivo, una vez que la
    // secretaría cotejó al alumno contra el informe de tesorería (única
    // fuente real de verdad para efectivo, ya que el recibo lo emite la
    // propia universidad). Si el informe muestra otra fecha de pago, se
    // puede corregir acá y se recalcula el recargo correspondiente.
    public function confirmarEfectivo(Request $request, int $id)
    {
        $request->validate(['fecha_pago' => 'nullable|date']);

        $pago = PagoCuota::find($id);

        if (!$pago) {
            return response()->json(['message' => 'Registro no encontrado.'], 404);
        }

        if ($pago->estado !== 'pendiente_efectivo') {
            return response()->json(['message' => 'Este registro no está pendiente de confirmación en efectivo.'], 422);
        }

        $fechaPago = $request->filled('fecha_pago')
            ? \Carbon\Carbon::parse($request->fecha_pago)
            : $pago->fecha_pago;

        $montoExigible = $pago->monto_base !== null
            ? CuotaMensualService::calcularMontoExigible((float) $pago->monto_base, $fechaPago)
            : $pago->monto_exigible;

        $pago->update([
            'estado'         => 'pagado',
            'fecha_pago'     => $fechaPago->toDateString(),
            'monto_exigible' => $montoExigible,
            'confirmado_por' => $request->user()->id,
            'confirmado_en'  => now(),
        ]);

        return response()->json(['message' => 'Pago en efectivo confirmado.', 'cuota' => $pago]);
    }

    // Alumnos con al menos un período esperando confirmación de pago en
    // efectivo, para que la secretaría los recorra tras recibir el informe.
    public function pendientesEfectivo()
    {
        $usuarioIds = PagoCuota::where('estado', 'pendiente_efectivo')->distinct()->pluck('usuario_id');

        $alumnos = User::where('role', 'general')
            ->whereIn('id', $usuarioIds)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'legajo', 'email']);

        $data = $alumnos->map(function ($u) {
            $pendientes = PagoCuota::where('usuario_id', $u->id)
                ->where('estado', 'pendiente_efectivo')
                ->orderBy('periodo')
                ->get(['id', 'periodo', 'fecha_pago', 'monto_exigible']);

            return [
                'id'          => $u->id,
                'nombre'      => $u->nombre,
                'legajo'      => $u->legajo,
                'email'       => $u->email,
                'periodos'    => $pendientes->map(fn (PagoCuota $p) => [
                    'id'             => $p->id,
                    'periodo'        => $p->periodo,
                    'fecha_pago'     => $p->fecha_pago?->toDateString(),
                    'monto_exigible' => $p->monto_exigible,
                ])->values(),
            ];
        });

        return response()->json($data->values());
    }

    // Alumnos con al menos un período pendiente dentro del ciclo actual
    // (marzo-diciembre), filtrable por carrera.
    public function deudores(Request $request)
    {
        $request->validate(['carrera_id' => 'nullable|exists:carreras,id']);

        $usuarioIds = PagoCuota::where('estado', 'pendiente')->distinct()->pluck('usuario_id');

        $query = User::where('role', 'general')
            ->whereIn('id', $usuarioIds)
            ->orderBy('nombre');

        if ($request->filled('carrera_id')) {
            $carreraId = $request->carrera_id;
            $query->whereIn('id', function ($q) use ($carreraId) {
                $q->select('usuario_id')->from('carrera_usuario')->where('carrera_id', $carreraId);
            });
        }

        $alumnos = $query->get(['id', 'nombre', 'legajo', 'email']);

        $data = $alumnos->map(function ($u) {
            $periodosPendientes = PagoCuota::where('usuario_id', $u->id)
                ->where('estado', 'pendiente')
                ->orderBy('periodo')
                ->pluck('periodo');

            return [
                'id'                  => $u->id,
                'nombre'              => $u->nombre,
                'legajo'              => $u->legajo,
                'email'               => $u->email,
                'periodos_pendientes' => $periodosPendientes->values(),
                'meses_adeudados'     => $periodosPendientes->count(),
            ];
        });

        return response()->json($data->values());
    }

    public function getPlanEstudios()
    {
        $carrera = Carrera::where('nombre', 'Tecnicatura Universitaria en Programación')->firstOrFail();

        $materias = $carrera->materias()
            ->with('correlatividades')
            ->orderBy('nivel')
            ->orderBy('id')
            ->get()
            ->map(fn($m) => [
                'id'     => $m->id,
                'nombre' => $m->nombre,
                'nivel'  => $m->nivel,
                'prereq' => [
                    'cursadas'  => $m->correlatividades->where('condicion_requerida', 'regular')->pluck('requisito_id')->values(),
                    'aprobadas' => $m->correlatividades->where('condicion_requerida', 'aprobada')->pluck('requisito_id')->values(),
                ],
            ]);

        return response()->json(['carrera_id' => $carrera->id, 'materias' => $materias]);
    }

    public function storeMateria(Request $request)
    {
        $data = $request->validate([
            'carrera_id'        => 'required|exists:carreras,id',
            'nombre'            => 'required|string|max:255',
            'nivel'             => 'required|integer|min:1|max:2',
            'prereq.cursadas'   => 'array',
            'prereq.cursadas.*' => 'integer|exists:materias,id',
            'prereq.aprobadas'  => 'array',
            'prereq.aprobadas.*'=> 'integer|exists:materias,id',
        ]);

        $materia = Materia::create([
            'carrera_id' => $data['carrera_id'],
            'nombre'     => $data['nombre'],
            'nivel'      => $data['nivel'],
        ]);

        $this->syncCorrelatividades($materia->id, $data['prereq'] ?? []);

        return response()->json($this->materiaConPrereq($materia->id), 201);
    }

    public function updateMateria(Request $request, int $id)
    {
        $materia = Materia::findOrFail($id);

        $data = $request->validate([
            'nombre'            => 'required|string|max:255',
            'nivel'             => 'required|integer|min:1|max:2',
            'prereq.cursadas'   => 'array',
            'prereq.cursadas.*' => 'integer|exists:materias,id',
            'prereq.aprobadas'  => 'array',
            'prereq.aprobadas.*'=> 'integer|exists:materias,id',
        ]);

        $materia->update(['nombre' => $data['nombre'], 'nivel' => $data['nivel']]);

        $this->syncCorrelatividades($materia->id, $data['prereq'] ?? []);

        return response()->json($this->materiaConPrereq($materia->id));
    }

    public function destroyMateria(int $id)
    {
        $materia = Materia::findOrFail($id);
        $materia->delete();
        return response()->json(['message' => 'Materia eliminada correctamente.']);
    }

    private function syncCorrelatividades(int $materiaId, array $prereq): void
    {
        DB::table('correlatividades')->where('materia_id', $materiaId)->delete();

        $ahora = now();
        $rows  = [];

        foreach ($prereq['cursadas'] ?? [] as $rid) {
            $rows[] = ['materia_id' => $materiaId, 'requisito_id' => $rid, 'condicion_requerida' => 'regular', 'created_at' => $ahora, 'updated_at' => $ahora];
        }
        foreach ($prereq['aprobadas'] ?? [] as $rid) {
            $rows[] = ['materia_id' => $materiaId, 'requisito_id' => $rid, 'condicion_requerida' => 'aprobada', 'created_at' => $ahora, 'updated_at' => $ahora];
        }

        if ($rows) DB::table('correlatividades')->insertOrIgnore($rows);
    }

    private function materiaConPrereq(int $id): array
    {
        $m = Materia::with('correlatividades')->findOrFail($id);
        return [
            'id'     => $m->id,
            'nombre' => $m->nombre,
            'nivel'  => $m->nivel,
            'prereq' => [
                'cursadas'  => $m->correlatividades->where('condicion_requerida', 'regular')->pluck('requisito_id')->values(),
                'aprobadas' => $m->correlatividades->where('condicion_requerida', 'aprobada')->pluck('requisito_id')->values(),
            ],
        ];
    }

    public function eliminarAlumno(int $id)
    {
        $usuario = User::where('id', $id)->where('role', 'general')->first();

        if (!$usuario) {
            return response()->json(['message' => 'Alumno no encontrado.'], 404);
        }

        $usuario->tokens()->delete();
        $usuario->delete();

        return response()->json(['message' => 'Alumno eliminado correctamente.']);
    }
}
