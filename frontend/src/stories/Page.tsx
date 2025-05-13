import React from "react";

import { Header } from "./Header";
import "./page.css";

type User = {
  name: string;
};

export const Page: React.FC = () => {
  const [user, setUser] = React.useState<User>();

  return (
    <article data-oid="nhykivd">
      <Header
        user={user}
        onLogin={() => setUser({ name: "Jane Doe" })}
        onLogout={() => setUser(undefined)}
        onCreateAccount={() => setUser({ name: "Jane Doe" })}
        data-oid="i-f-_0_"
      />

      <section className="storybook-page" data-oid="mrmicn1">
        <h2 data-oid="r_oecv8">Pages in Storybook</h2>
        <p data-oid="b64.ofi">
          We recommend building UIs with a{" "}
          <a
            href="https://componentdriven.org"
            target="_blank"
            rel="noopener noreferrer"
            data-oid="30sc8k_"
          >
            <strong data-oid="u:lv5mf">component-driven</strong>
          </a>{" "}
          process starting with atomic components and ending with pages.
        </p>
        <p data-oid="f3ely4h">
          Render pages with mock data. This makes it easy to build and review
          page states without needing to navigate to them in your app. Here are
          some handy patterns for managing page data in Storybook:
        </p>
        <ul data-oid="xfon9o2">
          <li data-oid="iel3ed9">
            Use a higher-level connected component. Storybook helps you compose
            such data from the &quot;args&quot; of child component stories
          </li>
          <li data-oid="3pu1qsl">
            Assemble data in the page component from your services. You can mock
            these services out using Storybook.
          </li>
        </ul>
        <p data-oid="h7p:wcc">
          Get a guided tutorial on component-driven development at{" "}
          <a
            href="https://storybook.js.org/tutorials/"
            target="_blank"
            rel="noopener noreferrer"
            data-oid="w5jnups"
          >
            Storybook tutorials
          </a>
          . Read more in the{" "}
          <a
            href="https://storybook.js.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            data-oid="e2dh1k."
          >
            docs
          </a>
          .
        </p>
        <div className="tip-wrapper" data-oid="hx9nq9a">
          <span className="tip" data-oid="5f6xd48">
            Tip
          </span>{" "}
          Adjust the width of the canvas with the{" "}
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            xmlns="http://www.w3.org/2000/svg"
            data-oid="9opiu5."
          >
            <g fill="none" fillRule="evenodd" data-oid="lt6qirv">
              <path
                d="M1.5 5.2h4.8c.3 0 .5.2.5.4v5.1c-.1.2-.3.3-.4.3H1.4a.5.5 0 01-.5-.4V5.7c0-.3.2-.5.5-.5zm0-2.1h6.9c.3 0 .5.2.5.4v7a.5.5 0 01-1 0V4H1.5a.5.5 0 010-1zm0-2.1h9c.3 0 .5.2.5.4v9.1a.5.5 0 01-1 0V2H1.5a.5.5 0 010-1zm4.3 5.2H2V10h3.8V6.2z"
                id="a"
                fill="#999"
                data-oid="cj.golh"
              />
            </g>
          </svg>
          Viewports addon in the toolbar
        </div>
      </section>
    </article>
  );
};
