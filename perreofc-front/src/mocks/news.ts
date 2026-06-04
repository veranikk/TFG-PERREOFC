/**
 * Mock data used by the frontend for news scenarios.
 * These fixtures help screens render predictable examples while developing or testing.
 */

import { NewsArticle } from '../types';

export const MOCK_NEWS: NewsArticle[] = [
  {
    id: 'news-001',
    title: '¡Tres puntos de oro! Perreo FC 3-1 CD Montaña Blanca',
    body: `El Campo Municipal de Perreolandia vivió una tarde de fútbol de altura el pasado sábado. Perreo FC desplegó su mejor versión ante CD Montaña Blanca y se llevó los tres puntos con autoridad en una de las actuaciones más completas de la temporada.

El encuentro comenzó con mucha intensidad por ambos lados. El equipo visitante llegó con la intención de sorprender, pero la solidez defensiva de los locales neutralizó cualquier intento de peligro en los primeros compases. Fue el propio Pepe Núñez quien rompió el hielo en el minuto 23 con un disparo cruzado que batió por la escuadra al portero rival.

La segunda mitad fue un monólogo de Perreo FC. Pepe Núñez completó su doblete en el minuto 58 aprovechando un pase en profundidad de Toni García. El tanto del descuento de los visitantes en el 71 fue anecdótico; Borja Llorente rubricó la goleada con un golazo de falta directa en el 84.

Una victoria que consolida al equipo en posiciones de permanencia y que da confianza de cara al tramo decisivo de la temporada. El vestuario celebró con euforia un resultado que nadie pone en duda: merecido por trabajo, esfuerzo y perrería.`,
    imageUrl: 'https://picsum.photos/seed/match-win/800/450',
    category: 'VICTORIA',
    author: 'Redacción Perreo FC',
    publishedAt: '2026-03-22T16:30:00Z',
    readTimeMinutes: 3,
    featured: true,
  },
  {
    id: 'news-002',
    title: 'Bienvenido, Carlos Pérez: el lateral que necesitábamos',
    body: `Perreo FC anuncia con orgullo la incorporación de Carlos Pérez, lateral derecho con dilatada experiencia en categorías regionales, que se une a la plantilla para reforzar el lateral derecho hasta final de temporada.

Carlos, de 26 años y natural de la ciudad, llega procedente del CD Cercanías tras una primera vuelta de notable nivel. "Perreo FC me llamó y no lo dudé ni un segundo. Conozco el ambiente de este club y sé lo que significa para la gente del barrio", declaró el jugador en su presentación.

El presidente del club, Marcos Jiménez, afirmó que "la incorporación de Carlos cubre una necesidad que teníamos en el lateral. Es un jugador comprometido, conoce la categoría y viene con hambre de seguir creciendo. Estamos muy contentos de tenerle con nosotros".

Carlos ya ha completado sus primeros entrenamientos con el grupo y podría debutar el próximo sábado frente al Deportivo Norte.`,
    imageUrl: 'https://picsum.photos/seed/signing-player/800/450',
    category: 'FICHAJE',
    author: 'Prensa oficial',
    publishedAt: '2026-03-15T10:00:00Z',
    readTimeMinutes: 2,
    featured: false,
  },
  {
    id: 'news-003',
    title: 'Así fue el amistoso frente al FC Retiro (1-1)',
    body: `Útil empate en el desplazamiento al Campo Municipal de Retiro. El equipo de Perreolandia demostró una sólida organización defensiva y buena circulación de balón durante los 90 minutos de un partido amistoso disputado antes del parón de Semana Santa.

El técnico aprovechó el encuentro para probar variantes tácticas y dar minutos a jugadores que tienen menos participación. La alineación fue rotada en su totalidad en el descanso, lo que dio continuidad física y ritmo competitivo a toda la plantilla.

El tanto de la igualdad llegó en la segunda parte gracias a una jugada de estrategia a balón parado que el equipo ha estado trabajando toda la semana en el entrenamiento. Una señal positiva que indica que el trabajo táctico está dando sus frutos.

El míster se mostró satisfecho: "El resultado es lo de menos. Hemos trabajado bien, todos han dado su mejor nivel y volvemos a casa sin lesiones. Eso es lo más importante antes de los partidos que vienen."`,
    imageUrl: 'https://picsum.photos/seed/friendly-match/800/450',
    category: 'CRÓNICA',
    author: 'Redacción Perreo FC',
    publishedAt: '2026-03-29T18:00:00Z',
    readTimeMinutes: 2,
    featured: false,
  },
  {
    id: 'news-004',
    title: 'Entrevista con Pepe Núñez: "Somos un equipo muy unido"',
    body: `El delantero titular de Perreo FC atiende a nuestra redacción tras una semana de ensueño en la que marcó tres goles en dos partidos. Pepe Núñez habla con naturalidad, con los pies en el suelo y la mirada puesta en el objetivo colectivo.

**¿Cómo estás viviendo este momento?**
Muy bien, feliz. Pero lo que más me alegra es que el equipo está respondiendo. Los goles son una consecuencia del trabajo colectivo. Sin mis compañeros abriendo espacios, yo no hago nada.

**¿Cuál es el ambiente en el vestuario?**
Increíble. Somos un equipo muy unido, nos conocemos hace tiempo, muchos llevamos años juntos. Eso se nota en el campo: cuando las cosas se ponen difíciles, nos apoyamos los unos a los otros.

**¿Cuál es el objetivo para el tramo final?**
La permanencia es lo primero. Estamos a buen número de los puestos de descenso, pero en esta categoría cualquier cosa puede pasar. Partido a partido, sin mirar la clasificación hasta que las matemáticas lo digan.

**¿Algo para la afición?**
Que sigan viniendo, que se lo merecen. Cuando el campo llena, se nota. Este sábado frente al Deportivo Norte los necesitamos en las gradas.`,
    imageUrl: 'https://picsum.photos/seed/player-interview/800/450',
    category: 'ENTREVISTA',
    author: 'Redacción Perreo FC',
    publishedAt: '2026-03-28T09:00:00Z',
    readTimeMinutes: 4,
    featured: true,
  },
  {
    id: 'news-005',
    title: 'Análisis táctico: ¿Qué falló en Atlético Barrio?',
    body: `La derrota ante Atlético Barrio (2-0) dejó una imagen del equipo que no gusta. Analizamos los datos y las claves de un partido que el equipo debe aprender a gestionar mejor en el futuro.

El mayor problema fue la presión alta del rival en las salidas de balón. Perreo FC no supo resolver la primera línea de presión, lo que generó pérdidas en campo propio que el Atlético aprovechó con velocidad en transición. Los dos goles llegaron precisamente de esas situaciones.

En posesión, el equipo tuvo el 48% del balón pero apenas generó situaciones de peligro. Solo un tiro entre los tres palos en 90 minutos es un dato que habla por sí solo. La ausencia de Toni García por lesión muscular se notó en la creatividad por la izquierda.

En defensa, la línea de cuatro fue demasiado alta en el primer gol, dejando un espacio de casi 20 metros a la espalda que el delantero rival explotó con una carrera perfectamente cronometrada.

El técnico reconoció los errores en rueda de prensa: "Sabemos qué falló y ya lo hemos trabajado en los entrenamientos. Este tipo de partidos nos hacen crecer. El equipo tiene carácter para reponerse."`,
    imageUrl: 'https://picsum.photos/seed/tactical-analysis/800/450',
    category: 'ANÁLISIS',
    author: 'Área técnica',
    publishedAt: '2026-04-06T12:00:00Z',
    readTimeMinutes: 5,
    featured: false,
  },
  {
    id: 'news-006',
    title: 'Preview: Recibimos al Deportivo Norte este sábado',
    body: `La jornada 24 nos trae al Campo Municipal de Perreolandia al Deportivo Norte, un rival incómodo que llega en un buen momento de forma. Repasamos todo lo que necesitas saber sobre el partido de este sábado a las 12:00.

El Deportivo Norte ocupa actualmente la séptima posición con 31 puntos, cinco más que Perreo FC. Vienen de encadenar tres victorias consecutivas que les ha alejado de la zona baja. Su arma principal es el juego directo con un delantero de referencia, Martín Solís, que lleva 14 goles esta temporada.

Por el lado de Perreo FC, el cuerpo técnico recupera a Toni García, que ha completado los entrenamientos esta semana sin molestias. La principal duda es Miguel Santos, que arrastra unas molestias en el tobillo y será evaluado el viernes por el servicio médico.

La clave del partido estará en la gestión de las segundas jugadas y en la precisión en las transiciones. Si el equipo consigue mantener la solidez defensiva que mostró ante Montaña Blanca, tendrá opciones reales de sumar los tres puntos.

Las entradas están disponibles en el estadio desde las 10:30. La entrada es gratuita para socios.`,
    imageUrl: 'https://picsum.photos/seed/match-preview/800/450',
    category: 'PREVIA',
    author: 'Redacción Perreo FC',
    publishedAt: '2026-04-10T08:00:00Z',
    readTimeMinutes: 3,
    featured: true,
  },
  {
    id: 'news-007',
    title: '¡EN DIRECTO! Perreo FC vs Deportivo Norte — Jornada 24',
    body: `Sigue en directo el partido de la Jornada 24. Perreo FC recibe al Deportivo Norte en el Campo Municipal de Perreolandia. Comenzamos a las 12:00 con el árbitro principal Marcos Serrano al frente.

**MINUTO 34 ·** ¡¡¡GOOOOOL DE PERREO FC!!! Jugada de estrategia ensayada durante la semana. Córner botado por Javi Muñoz, Sergio Torres se eleva por encima de todos y cabecea al fondo de la red. 1-0.

**MINUTO 28 ·** Tarjeta amarilla para el lateral derecho del Deportivo Norte tras una falta sobre Toni García.

**MINUTO 15 ·** El partido está intenso. Ambos equipos se están disputando el centro del campo. Perreo FC tiene un poco más de posesión pero sin ocasiones claras todavía.

**MINUTO 1 ·** ¡Arrancamos! Buenas condiciones meteorológicas en Perreolandia. Sol y temperatura agradable. El once titular de Perreo FC: García; Méndez, Torres, Romero, Martín; Ruiz, Muñoz, Llorente; Santos, Núñez, T. García.`,
    imageUrl: 'https://picsum.photos/seed/live-match/800/450',
    category: 'EN DIRECTO',
    author: 'Redacción Perreo FC',
    publishedAt: '2026-04-11T12:00:00Z',
    readTimeMinutes: 1,
    featured: true,
  },
  {
    id: 'news-008',
    title: 'El club presenta la nueva camiseta para la temporada 2026-27',
    body: `Perreo FC ha presentado oficialmente el diseño de la camiseta titular para la próxima temporada 2026-27. La nueva equipación mantiene el naranja como color corporativo pero incorpora un diseño renovado con detalles en negro que le dan un toque más moderno y atrevido.

La camiseta está fabricada con materiales reciclados, en línea con el compromiso del club con la sostenibilidad medioambiental. "Queremos que nuestros jugadores luzcan orgullosos los colores del club, pero también que lo hagan de manera responsable con el planeta", explicó el director deportivo.

La equipación alternativa, en blanco con detalles naranjas, también fue presentada en el mismo acto. Ambas estarán disponibles en la tienda oficial del club a partir del 1 de mayo.

Los socios que renueven antes del 30 de abril tendrán un 20% de descuento en la compra de cualquiera de las dos camisetas. El precio de venta al público será de 45€ para la camiseta adulto y 35€ para la infantil.`,
    imageUrl: 'https://picsum.photos/seed/new-kit/800/450',
    category: 'CLUB',
    author: 'Prensa oficial',
    publishedAt: '2026-04-08T11:00:00Z',
    readTimeMinutes: 2,
    featured: false,
  },
];
