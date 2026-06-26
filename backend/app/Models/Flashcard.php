<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flashcard extends Model
{
    protected $table = 'flashcards';

    protected $fillable = ['mazo_id', 'pregunta', 'respuesta', 'correctas', 'incorrectas', 'ultimo_resultado', 'caja'];

    public function deck()
    {
        return $this->belongsTo(FlashcardDeck::class, 'mazo_id');
    }
}
