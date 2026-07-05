<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tarea extends Model
{
    protected $fillable = [
        'usuario_id',
        'materia_id',
        'titulo',
        'descripcion',
        'orden',
        'columna',
        'fecha_vencimiento',
    ];

    protected $casts = [
        'fecha_vencimiento' => 'datetime',
        'orden' => 'double',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function materia()
    {
        return $this->belongsTo(Materia::class);
    }

    public function subtareas()
    {
        return $this->hasMany(TareaSubtarea::class);
    }
}
