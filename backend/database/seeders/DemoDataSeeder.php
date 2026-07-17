<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Materia;
use App\Models\MateriaUsuario;
use App\Models\Nota;
use App\Models\Tarea;
use App\Models\Marcador;
use App\Models\FlashcardDeck;
use App\Models\Flashcard;
use App\Models\SesionPomodoro;
use App\Models\PagoCuota;
use App\Models\Alerta;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Obtener al estudiante de prueba
        $user = User::where('email', 'Testuser@cursus.com')->first();
        if (!$user) {
            return;
        }

        // Limpiar datos previos del usuario de prueba para poder re-ejecutar sin duplicados
        $materiaUsuarioIds = MateriaUsuario::where('usuario_id', $user->id)->pluck('id');
        Nota::whereIn('materia_usuario_id', $materiaUsuarioIds)->delete();
        MateriaUsuario::where('usuario_id', $user->id)->delete();
        Tarea::where('usuario_id', $user->id)->delete();
        Marcador::where('usuario_id', $user->id)->delete();
        
        $deckIds = FlashcardDeck::where('usuario_id', $user->id)->pluck('id');
        Flashcard::whereIn('mazo_id', $deckIds)->delete();
        FlashcardDeck::where('usuario_id', $user->id)->delete();
        
        SesionPomodoro::where('usuario_id', $user->id)->delete();
        PagoCuota::where('usuario_id', $user->id)->delete();
        Alerta::where('usuario_id', $user->id)->delete();

        // 2. Cargar materias y estados históricos
        // Nivel 1 (Aprobadas con notas de parciales, TPs y examen final)
        $materiasAprobadasConfig = [
            1 => ['nombre' => 'Programación I', 'final' => 8, 'p1' => 8, 'p2' => 7, 'tp' => 9],
            2 => ['nombre' => 'Arquitectura y Sistemas Operativos', 'final' => 9, 'p1' => 9, 'p2' => 8, 'tp' => 10],
            3 => ['nombre' => 'Matemática', 'final' => 7, 'p1' => 6, 'p2' => 7, 'tp' => 8],
            4 => ['nombre' => 'Organización Empresarial', 'final' => 10, 'p1' => 9, 'p2' => 10, 'tp' => 10],
            5 => ['nombre' => 'Programación II', 'final' => 8, 'p1' => 7, 'p2' => 8, 'tp' => 9],
            7 => ['nombre' => 'Base de Datos I', 'final' => 9, 'p1' => 8, 'p2' => 9, 'tp' => 10],
            8 => ['nombre' => 'Inglés I', 'final' => 8, 'p1' => 8, 'p2' => 8, 'tp' => 9],
        ];

        foreach ($materiasAprobadasConfig as $materiaId => $config) {
            $mu = MateriaUsuario::create([
                'usuario_id' => $user->id,
                'materia_id' => $materiaId,
                'estado_historico' => 'aprobada'
            ]);

            // Cargar notas parciales e históricas
            Nota::create([
                'materia_usuario_id' => $mu->id,
                'tipo' => 'parcial',
                'numero' => 1,
                'valor' => $config['p1'],
                'fecha' => now()->subMonths(10)->toDateString()
            ]);

            Nota::create([
                'materia_usuario_id' => $mu->id,
                'tipo' => 'parcial',
                'numero' => 2,
                'valor' => $config['p2'],
                'fecha' => now()->subMonths(8)->toDateString()
            ]);

            Nota::create([
                'materia_usuario_id' => $mu->id,
                'tipo' => 'tp',
                'numero' => 1,
                'valor' => $config['tp'],
                'fecha' => now()->subMonths(7)->toDateString()
            ]);

            Nota::create([
                'materia_usuario_id' => $mu->id,
                'tipo' => 'final',
                'numero' => 1,
                'valor' => $config['final'],
                'fecha' => now()->subMonths(6)->toDateString()
            ]);
        }

        // Nivel 1 (Regular)
        MateriaUsuario::create([
            'usuario_id' => $user->id,
            'materia_id' => 6, // Probabilidad y Estadística
            'estado_historico' => 'regular'
        ]);

        // Nivel 2 (Cursando)
        $cursandoIds = [9, 10, 11, 12, 13]; // Programación III, BD II, Metodología I, Inglés II, Programación IV
        $cursandoMateriasUsuario = [];
        foreach ($cursandoIds as $materiaId) {
            $cursandoMateriasUsuario[$materiaId] = MateriaUsuario::create([
                'usuario_id' => $user->id,
                'materia_id' => $materiaId,
                'estado_historico' => 'cursando'
            ]);
        }

        // Agregar notas parciales para simular cursada activa
        // Programación IV (materia_id: 13)
        Nota::create([
            'materia_usuario_id' => $cursandoMateriasUsuario[13]->id,
            'tipo' => 'parcial',
            'numero' => 1,
            'valor' => 9,
            'fecha' => now()->subDays(15)->toDateString()
        ]);
        Nota::create([
            'materia_usuario_id' => $cursandoMateriasUsuario[13]->id,
            'tipo' => 'tp',
            'numero' => 1,
            'valor' => 8.5,
            'fecha' => now()->subDays(5)->toDateString()
        ]);

        // Base de Datos II (materia_id: 10)
        Nota::create([
            'materia_usuario_id' => $cursandoMateriasUsuario[10]->id,
            'tipo' => 'parcial',
            'numero' => 1,
            'valor' => 8,
            'fecha' => now()->subDays(20)->toDateString()
        ]);

        // Metodología de Sistemas I (materia_id: 11)
        Nota::create([
            'materia_usuario_id' => $cursandoMateriasUsuario[11]->id,
            'tipo' => 'parcial',
            'numero' => 1,
            'valor' => 7.50,
            'fecha' => now()->subDays(12)->toDateString()
        ]);

        // Inglés II (materia_id: 12)
        Nota::create([
            'materia_usuario_id' => $cursandoMateriasUsuario[12]->id,
            'tipo' => 'tp',
            'numero' => 1,
            'valor' => 9,
            'fecha' => now()->subDays(8)->toDateString()
        ]);

        // Nivel 2 (Pendientes/Bloqueadas por correlatividad)
        $pendientesIds = [14, 15, 16, 17, 18];
        foreach ($pendientesIds as $materiaId) {
            MateriaUsuario::create([
                'usuario_id' => $user->id,
                'materia_id' => $materiaId,
                'estado_historico' => 'libre'
            ]);
        }

        // 3. Tareas del Kanban para Programación IV (materia_id: 13)
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 13,
            'titulo' => 'Implementar backend de la API (Laravel)',
            'fecha_vencimiento' => now()->addDays(3)->toDateString(),
            'columna' => 'pendiente',
            'orden' => 1000
        ]);
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 13,
            'titulo' => 'Configurar base de datos SQLite y seeders',
            'fecha_vencimiento' => now()->addDays(5)->toDateString(),
            'columna' => 'pendiente',
            'orden' => 2000
        ]);
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 13,
            'titulo' => 'Preparar presentación final y video promocional',
            'fecha_vencimiento' => now()->addDays(7)->toDateString(),
            'columna' => 'pendiente',
            'orden' => 3000
        ]);

        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 13,
            'titulo' => 'Integrar estilos responsivos (Glassmorphism)',
            'fecha_vencimiento' => now()->addDay()->toDateString(),
            'columna' => 'progreso',
            'orden' => 1000
        ]);

        $tareasFinalizadas13 = [
            'Mockups y Wireframes del diseño de Cursus',
            'Configurar Laravel Sanctum para login de usuarios',
            'Crear migraciones y esquemas de base de datos relacional',
            'Maquetar barra lateral (sidebar) del administrador y alumno',
            'Diseñar modelo e integración de Google AI Studio en backend',
            'Corregir validaciones de presets y subida de imágenes de perfil'
        ];
        foreach ($tareasFinalizadas13 as $idx => $titulo) {
            Tarea::create([
                'usuario_id' => $user->id,
                'materia_id' => 13,
                'titulo' => $titulo,
                'fecha_vencimiento' => now()->subDays(10 - $idx)->toDateString(),
                'columna' => 'finalizado',
                'orden' => 1000 * ($idx + 1)
            ]);
        }

        // Tareas del Kanban para Base de Datos II (materia_id: 10)
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 10,
            'titulo' => 'Crear índices de búsqueda para legajo de alumno',
            'fecha_vencimiento' => now()->addDays(4)->toDateString(),
            'columna' => 'pendiente',
            'orden' => 1000
        ]);
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 10,
            'titulo' => 'Escribir consultas SQL optimizadas para reportes administrativos',
            'fecha_vencimiento' => now()->addDays(2)->toDateString(),
            'columna' => 'progreso',
            'orden' => 1000
        ]);
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 10,
            'titulo' => 'Diseñar modelo Entidad-Relación de Cursus',
            'fecha_vencimiento' => now()->subDays(12)->toDateString(),
            'columna' => 'finalizado',
            'orden' => 1000
        ]);
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 10,
            'titulo' => 'Escribir disparadores (Triggers) para bitácora de auditoría',
            'fecha_vencimiento' => now()->subDays(6)->toDateString(),
            'columna' => 'finalizado',
            'orden' => 2000
        ]);

        // Tareas del Kanban para Metodología de Sistemas I (materia_id: 11)
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 11,
            'titulo' => 'Elegir caso de estudio para el TP grupal semestral',
            'fecha_vencimiento' => now()->addDays(6)->toDateString(),
            'columna' => 'pendiente',
            'orden' => 1000
        ]);
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 11,
            'titulo' => 'Redactar especificación de requerimientos de software (SRS)',
            'fecha_vencimiento' => now()->addDays(2)->toDateString(),
            'columna' => 'progreso',
            'orden' => 1000
        ]);
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 11,
            'titulo' => 'Comparar metodologías ágiles clásicas (Scrum vs Kanban)',
            'fecha_vencimiento' => now()->subDays(8)->toDateString(),
            'columna' => 'finalizado',
            'orden' => 1000
        ]);
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 11,
            'titulo' => 'Crear backlog inicial del producto con historias de usuario',
            'fecha_vencimiento' => now()->subDays(4)->toDateString(),
            'columna' => 'finalizado',
            'orden' => 2000
        ]);

        // Tareas del Kanban para Inglés II (materia_id: 12)
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 12,
            'titulo' => 'Repasar verbos modales de recomendación y obligación',
            'fecha_vencimiento' => now()->addDays(8)->toDateString(),
            'columna' => 'pendiente',
            'orden' => 1000
        ]);
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 12,
            'titulo' => 'Reading comprehension: Technical Writing guidelines',
            'fecha_vencimiento' => now()->subDays(10)->toDateString(),
            'columna' => 'finalizado',
            'orden' => 1000
        ]);
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 12,
            'titulo' => 'Vocabulary Quiz 1: Common software terms',
            'fecha_vencimiento' => now()->subDays(3)->toDateString(),
            'columna' => 'finalizado',
            'orden' => 2000
        ]);

        // Tareas del Kanban para Programación III (materia_id: 9)
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 9,
            'titulo' => 'Implementar validaciones del frontend en registros',
            'fecha_vencimiento' => now()->addDays(6)->toDateString(),
            'columna' => 'progreso',
            'orden' => 1000
        ]);
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 9,
            'titulo' => 'Crear servicios de consumo de API REST en Node',
            'fecha_vencimiento' => now()->subDays(8)->toDateString(),
            'columna' => 'finalizado',
            'orden' => 1000
        ]);
        Tarea::create([
            'usuario_id' => $user->id,
            'materia_id' => 9,
            'titulo' => 'Desplegar backend de prueba en Vercel',
            'fecha_vencimiento' => now()->subDays(15)->toDateString(),
            'columna' => 'finalizado',
            'orden' => 2000
        ]);

        // 4. Marcadores en Bóveda en diferentes materias
        // Programación IV (materia_id: 13)
        Marcador::create([
            'usuario_id' => $user->id,
            'materia_id' => 13,
            'titulo' => 'Campus Virtual UTN Haedo',
            'url' => 'https://campus.frh.utn.edu.ar/'
        ]);
        Marcador::create([
            'usuario_id' => $user->id,
            'materia_id' => 13,
            'titulo' => 'Documentación de Laravel (Eloquent)',
            'url' => 'https://laravel.com/docs/eloquent'
        ]);
        Marcador::create([
            'usuario_id' => $user->id,
            'materia_id' => 13,
            'titulo' => 'GitHub - Repositorio Cursus',
            'url' => 'https://github.com/developer/cursus'
        ]);

        // Base de Datos II (materia_id: 10)
        Marcador::create([
            'usuario_id' => $user->id,
            'materia_id' => 10,
            'titulo' => 'dbdiagram.io - Modelador de BD',
            'url' => 'https://dbdiagram.io/'
        ]);
        Marcador::create([
            'usuario_id' => $user->id,
            'materia_id' => 10,
            'titulo' => 'PostgreSQL Cheat Sheet',
            'url' => 'https://postgrescheatsheet.com'
        ]);

        // Metodología de Sistemas I (materia_id: 11)
        Marcador::create([
            'usuario_id' => $user->id,
            'materia_id' => 11,
            'titulo' => 'Trello - Tablero ágil del TP',
            'url' => 'https://trello.com'
        ]);
        Marcador::create([
            'usuario_id' => $user->id,
            'materia_id' => 11,
            'titulo' => 'Atlassian Agile Coach Documentation',
            'url' => 'https://www.atlassian.com/agile'
        ]);

        // Inglés II (materia_id: 12)
        Marcador::create([
            'usuario_id' => $user->id,
            'materia_id' => 12,
            'titulo' => 'WordReference Dictionary',
            'url' => 'https://www.wordreference.com'
        ]);
        Marcador::create([
            'usuario_id' => $user->id,
            'materia_id' => 12,
            'titulo' => 'Cambridge Grammar Explanations',
            'url' => 'https://dictionary.cambridge.org/'
        ]);

        // Programación III (materia_id: 9)
        Marcador::create([
            'usuario_id' => $user->id,
            'materia_id' => 9,
            'titulo' => 'W3Schools JavaScript Tutorial',
            'url' => 'https://www.w3schools.com/js/'
        ]);
        Marcador::create([
            'usuario_id' => $user->id,
            'materia_id' => 9,
            'titulo' => 'StackOverflow - Node.js Questions',
            'url' => 'https://stackoverflow.com/questions/tagged/node.js'
        ]);

        // 5. Mazos de Flashcards & Tarjetas para CADA MATERIA (5 tarjetas por mazo)
        
        // Mazo 1: Programación IV (Categoría: Programación)
        $deck1 = FlashcardDeck::create([
            'usuario_id' => $user->id,
            'nombre' => 'Programación IV — Conceptos Clave',
            'descripcion' => 'Preguntas teóricas sobre arquitectura MVC, Laravel y APIs REST.',
            'color' => 'indigo',
            'categoria' => 'Programación'
        ]);
        Flashcard::create([
            'mazo_id' => $deck1->id,
            'pregunta' => '¿Qué es Laravel?',
            'respuesta' => 'Un framework PHP de código abierto basado en el patrón MVC.',
            'distractor_1' => 'Una biblioteca de JavaScript para interfaces.',
            'distractor_2' => 'Un gestor de bases de datos relacionales.',
            'distractor_3' => 'Un servidor web ligero como Apache o Nginx.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck1->id,
            'pregunta' => '¿Qué función cumple Eloquent?',
            'respuesta' => 'Es el ORM integrado de Laravel para interactuar con la base de datos de manera orientada a objetos.',
            'distractor_1' => 'Un motor de plantillas frontend.',
            'distractor_2' => 'Un despachador de eventos asíncronos.',
            'distractor_3' => 'Una herramienta para compilar archivos CSS.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck1->id,
            'pregunta' => '¿Para qué sirve un Middleware en Laravel?',
            'respuesta' => 'Para filtrar y analizar las peticiones HTTP antes de que lleguen a los controladores.',
            'distractor_1' => 'Para compilar los recursos de Frontend.',
            'distractor_2' => 'Para realizar migraciones de base de datos.',
            'distractor_3' => 'Para encriptar las contraseñas de los usuarios.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck1->id,
            'pregunta' => '¿Qué es la inyección de dependencias?',
            'respuesta' => 'Un patrón de diseño que consiste en pasar a una clase sus dependencias en lugar de dejar que ella misma las cree.',
            'distractor_1' => 'Una forma de insertar código SQL malicioso en formularios.',
            'distractor_2' => 'El proceso de importar archivos CSS en el HTML.',
            'distractor_3' => 'Una función para redireccionar usuarios a otra página.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck1->id,
            'pregunta' => '¿Qué es el archivo web.php en Laravel?',
            'respuesta' => 'El archivo donde se definen las rutas web accesibles directamente por el navegador del usuario.',
            'distractor_1' => 'La configuración principal del motor de base de datos.',
            'distractor_2' => 'El archivo que contiene la estructura HTML base de la app.',
            'distractor_3' => 'La clase encargada de gestionar las cookies de sesión.'
        ]);

        // Mazo 2: Base de Datos II (Categoría: Base de Datos)
        $deck2 = FlashcardDeck::create([
            'usuario_id' => $user->id,
            'nombre' => 'Bases de Datos II — Avanzado',
            'descripcion' => 'Fundamentos de procedimientos almacenados, índices y triggers.',
            'color' => 'green',
            'categoria' => 'Base de Datos'
        ]);
        Flashcard::create([
            'mazo_id' => $deck2->id,
            'pregunta' => '¿Qué es un Procedimiento Almacenado (Stored Procedure)?',
            'respuesta' => 'Un conjunto de instrucciones SQL compiladas y almacenadas en el servidor de base de datos.',
            'distractor_1' => 'Un tipo de índice para búsquedas rápidas.',
            'distractor_2' => 'Una función JavaScript ejecutada en el navegador.',
            'distractor_3' => 'Un archivo de respaldo físico de la base de datos.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck2->id,
            'pregunta' => '¿Qué es un Trigger (Disparador)?',
            'respuesta' => 'Una regla que se ejecuta automáticamente en respuesta a ciertos eventos en una tabla (INSERT, UPDATE, DELETE).',
            'distractor_1' => 'Un tipo de dato especial para números decimales.',
            'distractor_2' => 'Una consulta SELECT con filtros avanzados.',
            'distractor_3' => 'Una herramienta para migrar datos de SQLite a MySQL.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck2->id,
            'pregunta' => '¿Qué es una Vista (View) en una base de datos?',
            'respuesta' => 'Una tabla virtual basada en el conjunto de resultados de una consulta SQL predefinida.',
            'distractor_1' => 'El diseño de la interfaz gráfica del usuario.',
            'distractor_2' => 'Una copia de seguridad del motor de base de datos.',
            'distractor_3' => 'Un índice que acelera las inserciones de registros.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck2->id,
            'pregunta' => '¿Qué es el Plan de Ejecución (Execution Plan)?',
            'respuesta' => 'El camino detallado que el motor de base de datos elige para ejecutar una consulta de la forma más óptima.',
            'distractor_1' => 'El cronograma de backups automáticos de la base de datos.',
            'distractor_2' => 'Una lista de privilegios asignados a un usuario admin.',
            'distractor_3' => 'Un script que borra datos duplicados automáticamente.'
        ]);

        // Mazo 3: Programación III (Categoría: Programación)
        $deck3 = FlashcardDeck::create([
            'usuario_id' => $user->id,
            'nombre' => 'Programación III — TypeScript y Node.js',
            'descripcion' => 'Conceptos esenciales del tipado estático y el entorno de ejecución Node.',
            'color' => 'purple',
            'categoria' => 'Programación'
        ]);
        Flashcard::create([
            'mazo_id' => $deck3->id,
            'pregunta' => '¿Qué es TypeScript?',
            'respuesta' => 'Un superconjunto de JavaScript que añade tipado estático y nuevas características.',
            'distractor_1' => 'Un framework frontend desarrollado por Microsoft.',
            'distractor_2' => 'Un motor de bases de datos no relacionales.',
            'distractor_3' => 'Un lenguaje compilado de bajo nivel para microprocesadores.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck3->id,
            'pregunta' => '¿Para qué sirve el archivo package.json?',
            'respuesta' => 'Para gestionar las dependencias, scripts y metadatos del proyecto de Node.js.',
            'distractor_1' => 'Para guardar las variables de entorno de producción.',
            'distractor_2' => 'Para maquetar la estructura HTML de la aplicación.',
            'distractor_3' => 'Para definir el diseño responsivo CSS.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck3->id,
            'pregunta' => '¿Qué es un tipo "Union" en TypeScript?',
            'respuesta' => 'Un tipo de dato que permite que una variable almacene valores de múltiples tipos especificados (usando el símbolo "|").',
            'distractor_1' => 'Una función que une dos arrays en uno solo.',
            'distractor_2' => 'Una consulta SQL que une resultados de dos tablas.',
            'distractor_3' => 'Un operador de JavaScript para sumar strings.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck3->id,
            'pregunta' => '¿Qué es Node.js?',
            'respuesta' => 'Un entorno de ejecución de JavaScript en tiempo de ejecución del lado del servidor basado en el motor V8 de Chrome.',
            'distractor_1' => 'Un framework de estilo CSS para maquetado responsivo.',
            'distractor_2' => 'Una biblioteca de frontend para interfaces reactivas.',
            'distractor_3' => 'Un navegador web alternativo especializado en desarrollo.'
        ]);

        // Mazo 4: Metodología de Sistemas I (Categoría: Metodologías)
        $deck4 = FlashcardDeck::create([
            'usuario_id' => $user->id,
            'nombre' => 'Metodología I — Scrum y Agilidad',
            'descripcion' => 'Fundamentos del marco de trabajo ágil Scrum y roles clave.',
            'color' => 'amber',
            'categoria' => 'Metodologías'
        ]);
        Flashcard::create([
            'mazo_id' => $deck4->id,
            'pregunta' => '¿Qué es el Product Backlog?',
            'respuesta' => 'Una lista ordenada y priorizada de todos los requisitos e historias de usuario del producto.',
            'distractor_1' => 'El código fuente del frontend listo para producción.',
            'distractor_2' => 'El cronograma con fechas fijas de entrega del proyecto.',
            'distractor_3' => 'El presupuesto financiero asignado al equipo de desarrollo.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck4->id,
            'pregunta' => '¿Cuál es el rol del Scrum Master?',
            'respuesta' => 'Facilitar el proceso Scrum, eliminar impedimentos y ayudar al equipo a seguir los valores ágiles.',
            'distractor_1' => 'Definir los requisitos comerciales y el retorno de inversión.',
            'distractor_2' => 'Escribir el código y diseñar la base de datos.',
            'distractor_3' => 'Aprobar o rechazar el presupuesto del cliente.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck4->id,
            'pregunta' => '¿Qué es una Retrospectiva (Sprint Retrospective)?',
            'respuesta' => 'Una reunión al final de cada Sprint donde el equipo reflexiona sobre el proceso para identificar mejoras.',
            'distractor_1' => 'Una demo del producto para el cliente final.',
            'distractor_2' => 'Una sesión de planificación de tareas futuras.',
            'distractor_3' => 'Una auditoría financiera de los costos del proyecto.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck4->id,
            'pregunta' => '¿Qué significa "Velocity" (Velocidad) en Scrum?',
            'respuesta' => 'La cantidad promedio de puntos de historia que el equipo completa con éxito en un Sprint.',
            'distractor_1' => 'La velocidad de carga del sitio web en producción.',
            'distractor_2' => 'La rapidez con la que el cliente aprueba los entregables.',
            'distractor_3' => 'El tiempo transcurrido desde el inicio del proyecto hasta su fin.'
        ]);

        // Mazo 5: Inglés II (Categoría: Inglés)
        $deck5 = FlashcardDeck::create([
            'usuario_id' => $user->id,
            'nombre' => 'Inglés II — Vocabulario Técnico IT',
            'descripcion' => 'Glosario y traducción de términos utilizados en la industria del software.',
            'color' => 'cyan',
            'categoria' => 'Inglés'
        ]);
        Flashcard::create([
            'mazo_id' => $deck5->id,
            'pregunta' => '¿Qué significa el término "Deployment"?',
            'respuesta' => 'Despliegue (el proceso de poner una aplicación en funcionamiento en un entorno de producción).',
            'distractor_1' => 'Desarrollo de código.',
            'distractor_2' => 'Depuración de errores.',
            'distractor_3' => 'Diseño de interfaces.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck5->id,
            'pregunta' => '¿Qué significa el término "Debugging"?',
            'respuesta' => 'Depuración (el proceso de identificar y corregir errores en el código fuente).',
            'distractor_1' => 'Compilación de paquetes.',
            'distractor_2' => 'Pruebas de usabilidad.',
            'distractor_3' => 'Distribución de software.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck5->id,
            'pregunta' => '¿Qué significa el término "Feature"?',
            'respuesta' => 'Característica o funcionalidad (una funcionalidad específica que ofrece la aplicación).',
            'distractor_1' => 'Error de programación (Bug).',
            'distractor_2' => 'Servidor de base de datos.',
            'distractor_3' => 'Contraseña encriptada.'
        ]);
        Flashcard::create([
            'mazo_id' => $deck5->id,
            'pregunta' => '¿Qué significa el término "Framework"?',
            'respuesta' => 'Marco de trabajo (una estructura conceptual y tecnológica que sirve de soporte para desarrollar software).',
            'distractor_1' => 'Un editor de texto avanzado.',
            'distractor_2' => 'Un sistema de bases de datos.',
            'distractor_3' => 'Un servidor web en la nube.'
        ]);

        // 6. Sesiones de Pomodoro para acumular estadísticas (semana actual + últimos 90 días)
        $cursandoIds = [9, 10, 11, 12, 13];

        // A) Asegurar estadísticas altas para la SEMANA ACTUAL (horas efectivas y perdidas)
        $semanaActualConfigs = [
            13 => ['completadas' => 8, 'abandonadas' => 3], // Programación IV
            10 => ['completadas' => 6, 'abandonadas' => 2], // BD II
            9  => ['completadas' => 5, 'abandonadas' => 2], // Prog III
            11 => ['completadas' => 4, 'abandonadas' => 1], // Metodología I
            12 => ['completadas' => 3, 'abandonadas' => 1], // Inglés II
        ];

        foreach ($semanaActualConfigs as $materiaId => $counts) {
            for ($c = 0; $c < $counts['completadas']; $c++) {
                $diaOffset = $c % 4; 
                SesionPomodoro::create([
                    'usuario_id' => $user->id,
                    'materia_id' => $materiaId,
                    'duracion_segundos' => 1500,
                    'estado' => 'completada',
                    'completada_en' => now()->subDays($diaOffset)->setTime(9 + $c, 0, 0)
                ]);
            }

            for ($a = 0; $a < $counts['abandonadas']; $a++) {
                $diaOffset = $a % 4;
                SesionPomodoro::create([
                    'usuario_id' => $user->id,
                    'materia_id' => $materiaId,
                    'duracion_segundos' => 600,
                    'estado' => 'abandonada',
                    'completada_en' => now()->subDays($diaOffset)->setTime(15 + $a, 30, 0)
                ]);
            }
        }

        // B) Racha de estudio consecutiva (los últimos 5 días consecutivos deben tener al menos una completada)
        for ($i = 0; $i < 5; $i++) {
            SesionPomodoro::create([
                'usuario_id' => $user->id,
                'materia_id' => 13,
                'duracion_segundos' => 1500,
                'estado' => 'completada',
                'completada_en' => now()->subDays($i)->setTime(14, 30, 0)
            ]);
        }

        // C) Generar actividad histórica (días 5 a 90) para el Heatmap y totales acumulados
        for ($day = 5; $day < 90; $day++) {
            if (rand(1, 100) <= 45) {
                $cantidadSesiones = rand(1, 4);
                $materiaId = $cursandoIds[array_rand($cursandoIds)];
                for ($s = 0; $s < $cantidadSesiones; $s++) {
                    $completada = rand(1, 100) <= 85; 
                    SesionPomodoro::create([
                        'usuario_id' => $user->id,
                        'materia_id' => $materiaId,
                        'duracion_segundos' => $completada ? rand(1200, 1800) : rand(300, 900),
                        'estado' => $completada ? 'completada' : 'abandonada',
                        'completada_en' => now()->subDays($day)->setTime(9 + $s, rand(0, 59), 0)
                    ]);
                }
            }
        }

        // 7. Registrar pago de cuota para el mes corriente
        PagoCuota::create([
            'usuario_id' => $user->id,
            'periodo' => now()->format('Y-m'),
            'fecha_pago' => now()->subDays(3)->toDateString(),
        ]);

        // 8. Crear alertas de prueba y simulación de parciales (para pintar el calendario)
        Alerta::create([
            'usuario_id' => $user->id,
            'categoria' => 'academic',
            'titulo' => 'Examen: Primer Parcial de Programación IV',
            'descripcion' => 'Examen presencial en el laboratorio. Temario: APIs REST y Laravel.',
            'fecha' => now()->addDays(5)->toDateString(),
            'prioridad' => 'alta',
            'color' => 'red',
            'completada' => false
        ]);

        Alerta::create([
            'usuario_id' => $user->id,
            'categoria' => 'academic',
            'titulo' => 'Entrega: Proyecto Final de BD II',
            'descripcion' => 'Subir archivo ZIP con scripts SQL de procedimientos almacenados, triggers e índices.',
            'fecha' => now()->addDays(12)->toDateString(),
            'prioridad' => 'alta',
            'color' => 'indigo',
            'completada' => false
        ]);

        Alerta::create([
            'usuario_id' => $user->id,
            'categoria' => 'academic',
            'titulo' => 'Examen: Primer Parcial de Programación III',
            'descripcion' => 'Examen sobre POO y TypeScript en Node.js.',
            'fecha' => now()->subDays(10)->toDateString(),
            'prioridad' => 'media',
            'color' => 'green',
            'completada' => true
        ]);

        Alerta::create([
            'usuario_id' => $user->id,
            'categoria' => 'administrative',
            'titulo' => 'Aviso: Matrícula y Cuota del mes saldada',
            'descripcion' => 'Tu comprobante de pago #91024 ha sido procesado por administración.',
            'fecha' => now()->toDateString(),
            'prioridad' => 'baja',
            'color' => 'green',
            'completada' => false
        ]);
    }
}
