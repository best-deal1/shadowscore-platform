import { renderToStaticMarkup } from "react-dom/server";
import { clientComponentDriver } from "./client-component-driver.mjs";
import * as identity from "../../lib/personalIdentity.ts";
import * as request from "../../lib/identityRequest.ts";

export async function renderPersonalReport(report) {
  const component = await clientComponentDriver(new URL("../../components/report/PersonalIdentityReport.tsx", import.meta.url), {
    modules: { "../../lib/personalIdentity": identity, "../../lib/identityRequest": request },
  });
  return renderToStaticMarkup(component.render({ report }));
}
