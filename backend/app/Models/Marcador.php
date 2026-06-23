<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Marcador extends Model
{
    protected $table = 'marcadores';

    protected $fillable = [
        'usuario_id',
        'materia_id',
        'url',
        'titulo',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function materia()
    {
        return $this->belongsTo(Materia::class);
    }
}
