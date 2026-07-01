<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Cuota;
use App\Models\Carrera;
use App\Models\Materia;
use App\Models\PagoCuota;
use App\Models\SesionPomodoro;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
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
                'id'     => $usuario->id,
                'nombre' => $usuario->nombre,
                'legajo' => $usuario->legajo,
                'email'  => $usuario->email,
            ],
            'materias' => $materias->values(),
            'pomodoro' => [
                'total_segundos' => $totalSegundos,
                'total_horas'    => round($totalSegundos / 3600, 1),
            ],
            'cuota_actual' => [
                'periodo'    => $periodoActual,
                'pagado'     => $pagoActual !== null,
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
        $cuotaVigente = Cuota::where('vigente_desde', '<=', $hoy)->orderBy('vigente_desde', 'desc')->first();
        $cuotaProxima = Cuota::where('vigente_desde', '>', $hoy)->orderBy('vigente_desde', 'asc')->first();
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
        $request->validate([
            'carrera_id'    => 'required|exists:carreras,id',
            'valor_mensual' => 'required|numeric|min:0',
            'vigente_desde' => 'required|date',
        ]);

        $hoy = now()->toDateString();

        // Si la fecha es futura, reemplazar cuotas futuras existentes para esa carrera
        if ($request->vigente_desde > $hoy) {
            Cuota::where('carrera_id', $request->carrera_id)
                 ->where('vigente_desde', '>', $hoy)
                 ->delete();
        }

        $cuota = Cuota::create($request->only(['carrera_id', 'valor_mensual', 'vigente_desde']));

        return response()->json($cuota, 201);
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
