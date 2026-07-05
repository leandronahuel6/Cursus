<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConfigPomodoro extends Model
{
    protected $table = 'config_pomodoro';
    protected $primaryKey = 'usuario_id';
    public $incrementing = false;

    protected $fillable = [
        'usuario_id',
        'preset_activo',
        'tiempo_enfoque',
        'descanso_corto',
        'descanso_largo',
        'sesiones_por_ciclo',
        'ciclos_totales',
        'sonido_alarma',
        'modo_estricto',
        'reproducir_alarma',
        'mostrar_widget',
        'auto_reproduccion_fases',
    ];

    protected $casts = [
        'modo_estricto' => 'boolean',
        'reproducir_alarma' => 'boolean',
        'mostrar_widget' => 'boolean',
        'auto_reproduccion_fases' => 'boolean',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
