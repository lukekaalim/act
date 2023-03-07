import type { Element } from "@lukekaalim/act";

export type RehersalPageLink = {
  path: string,
  title: string,
};

export type RehersalPage = {
  link: RehersalPageLink,
  children: RehersalPageLink[],
  content: Element
}