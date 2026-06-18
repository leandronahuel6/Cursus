<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Correlatividad extends Model
{
    protected $table = 'correlatividades';

    protected $fillable = [
        'materia_id',
        'requisito_id',
        'condicion_requerida',
    ];

    public function requisito(){
        return $this->belongsTo(Materia::class, 'requisito_id');
    }
}
