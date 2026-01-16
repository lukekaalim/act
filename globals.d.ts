declare module "typedoc:*" {
  import { JSONOutput } from 'typedoc';

  const project: JSONOutput.ProjectReflection;

  export default project;
}

declare module "*.md?parse" {
  import { Root } from 'mdast';

  const content: Root;

  export default content;
}

