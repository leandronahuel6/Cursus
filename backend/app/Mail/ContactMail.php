<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string  $tipo,
        public string  $asunto,
        public string  $descripcion,
        public string  $remitenteNombre,
        public string  $remitenteEmail,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[Cursus Contacto] {$this->asunto}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contact',
        );
    }
}
