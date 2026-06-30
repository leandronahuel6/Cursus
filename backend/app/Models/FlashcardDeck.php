<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FlashcardDeck extends Model
{
    protected $table = 'flashcard_decks';

    protected $fillable = ['nombre', 'descripcion', 'color', 'usuario_id', 'categoria'];

    public function user()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function flashcards()
    {
        return $this->hasMany(Flashcard::class, 'mazo_id');
    }
}
