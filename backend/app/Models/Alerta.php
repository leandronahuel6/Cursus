<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alerta extends Model
{
    protected $fillable = [
        'usuario_id',
        'categoria',
        'titulo',
        'descripcion',
        'fecha',
        'prioridad',
        'completada',
    ];

    protected $casts = [
        'fecha' => 'date:Y-m-d',
        'completada' => 'boolean',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
