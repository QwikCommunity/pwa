import { component$ } from "@builder.io/qwik";
import { StaticGenerateHandler, useLocation } from "@builder.io/qwik-city";

export default component$(() => {
  const loc = useLocation();
  return <div>Hello {loc.params.id}!</div>;
});

export const onStaticGenerate: StaticGenerateHandler = async ({ env }) => {
  return {
    params: ["1", "2", "3"].map((id) => {
      return { id };
    }),
  };
};
