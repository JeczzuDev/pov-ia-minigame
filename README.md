# POV-IA 🧠🔍

Juego web para resolver problemas con inteligencia humana asistida por recursos. 
Compite contra ti mismo (o el ranking) encontrando los mejores recursos para responder un desafío, y deja que una IA puntúe tus decisiones.

## 🚀 Demo

🔗 https://pov-ia.vercel.app/

## 📸 Capturas

![Pantalla de juego](./screenshots/play.png)
![Pantalla de resultados](./screenshots/result.png)
![Dashboard](./screenshots/dashboard.png)

## 🎮 ¿Cómo se juega?

1. Entra a la plataforma y recibe un desafío (ej: "Aprender a crear una API con Next.js").
2. Ingresa entre 1 y 4 URLs que consideres útiles para resolver el problema (videos, blogs, documentación…).
3. Una IA evalúa los recursos por su precisión, originalidad, claridad y valor complementario.
4. Recibes una puntuación total y puedes comparar tu resultado en el leaderboard.
5. Si juegas como anónimo, puedes registrarte luego para guardar tu partida.

### 🔓 ¿Hay que registrarse?

No es obligatorio. Puedes jugar como anónimo, pero si deseas guardar tu historial y aparecer en el ranking, deberás crear una cuenta. Clerk se encarga de la autenticación de forma segura.

---

## 🧠 Reglas del juego

- El puntaje se calcula automáticamente por IA, en base a:  
  precisión técnica, detalle, utilidad práctica, claridad, originalidad y complementariedad.
- Cada nivel entrega un prompt único y progresivo.
- No puedes repetir desafíos ya completados.
- Solo puedes jugar una vez por prompt.
- Los mejores puntajes aparecen en el ranking global acumulado.

---

## 🛠️ Tecnologías usadas

- [Next.js 14](https://nextjs.org/)
- [Clerk](https://clerk.dev/) – autenticación
- [Supabase](https://supabase.com/) – base de datos y almacenamiento
- [OpenAI / Gemini / Anthropic](https://platform.openai.com/) – evaluación automática
- [Tailwind CSS](https://tailwindcss.com/) – diseño
- Vercel – hosting

---

## 🧪 Cómo se usó Clerk

- Autenticación completa (sign in, sign up, user info)
- Protección de rutas con `middleware.ts`
- Asociación de partidas a usuarios registrados
- Asociación retroactiva de partidas anónimas al registrarse
- Visualización de historial privado en el dashboard

---

## 💡 ¿Por qué esta idea?

POV-IA busca explorar un ángulo creativo: ¿cómo se comportaría una persona si toma el rol de una IA?
Aquí tú actúas como un modelo de lenguaje humano: evalúas un problema y respondes con los mejores recursos posibles.

---

## 📅 Hackatón Clerk 2025

Este proyecto fue desarrollado como parte del concurso organizado por [@midudev](https://github.com/midudev) en colaboración con [Clerk](https://clerk.dev/).

- Fecha límite: 20 de mayo de 2025
- Votaciones en directo: 21 de mayo de 2025

---

## ✍️ Creador

Desarrollado con ❤️ por JeczzuDev 👤 para el Hackatón Clerk 2025

---

## 🧷 Licencia

MIT