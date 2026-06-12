<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Materia extends Model
{
    protected $fillable = [
        'carrera_id',
        'nombre',
        'nivel'
    ];

    public function materias(){
        return $this->hasMany(Materia::class);
    }

    public function carrera(){
        return $this->belongsTo(Carrera::class);
    }
}
