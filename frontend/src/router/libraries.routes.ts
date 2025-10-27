import { SingleLibrary } from "../views/libraries";
import { Home } from "../views";

export default [
  { path: "/libraries", name: "libraries", component: Home },
  { path: "/libraries/:id", name: "singleLibrary", component: SingleLibrary },
];
