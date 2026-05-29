<img width="1147" height="361" alt="image" src="https://github.com/user-attachments/assets/2f7b266e-6e08-4eee-8331-a63386a0099b" />

A client-first notes and todo tracker for Blue Prince. This project is run on [github pages](https://fredrikm97.github.io/blue-prince-notes/). It is client first and possible to download or upload documentation.

# Features

- Track notes, rooms and the story of the world of blue prince
- Graph to connect clues and story
- Track todos and mark them as completed when finished
- Upload images with the notes to help and remember the context
- Backup and upload your progress or activate sync to local folder to keep your progress secure
- Dark/Light mode

# Gallery

## Track the notes:

<img width="1260" height="502" alt="image" src="https://github.com/user-attachments/assets/f38e752c-6f93-413d-b7e1-b38653a36788" />

## Keep logs on the map:

<img width="1254" height="834" alt="image" src="https://github.com/user-attachments/assets/5fea20d3-3e3b-46c7-b0a1-138a68cfe18b" />

## Create detailed connections through the notes documentation with `@room`, `#tag` and more

<img width="1270" height="795" alt="image" src="https://github.com/user-attachments/assets/678dec61-e114-4b13-bc33-cfd2099e7135" />

## Easier tracking of todo list and what is finished and what to begin with!

<img width="1259" height="341" alt="image" src="https://github.com/user-attachments/assets/7d854301-1963-446d-a3de-3dea1822b060" />

# Routing Architecture (TanStack Start)

- `src/start.tsx`: framework runtime entrypoint and server middleware setup.
- `src/router.tsx`: root shell/layout, route components, and router creation in one place.
- `src/routes/__root.tsx`: minimal file-route root anchor used by TanStack route generation.
- `src/routeTree.gen.ts`: auto-generated route/type registry; do not edit manually.
- `src/routeTree.gen.ts` should be the only generated route tree file checked in.
- If route files are added/renamed, regenerate the route tree via your normal dev/build flow.
