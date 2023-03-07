// @flow strict

/*::
import type { ElementNode } from "@lukekaalim/act";

export type RehersalPageID = string;
export type RehersalPage = {
  id: RehersalPageID,
  title: string,
  path: string,
  content: ElementNode,

  searchableText?: () => Promise<string>,

  children: RehersalPage[],
  subsections: string[],
}
*/

export const normalizedPath = (path/*: string*/)/*: string*/ => {
  return decodeURI(path).toLocaleLowerCase().split('/').filter(Boolean).join('/');
}

export const flattenPages = (pages/*: RehersalPage[]*/)/*: RehersalPage[]*/ => {
  return pages.map(page => [page, ...flattenPages(page.children)]).flat(1);
}

export const calculatePageSelection = (
  id/*: RehersalPageID*/,
  page/*: RehersalPage*/,
)/*: 'unselected' | 'included' | 'selected'*/ => {
  if (page.id === id)
    return 'selected';
  
  if ((page.children || []).some(childPage => {
    const childSelected = calculatePageSelection(id, childPage)
    return childSelected === 'selected' || childSelected === 'included'
  }))
    return 'included';

  return 'unselected';
};

export const findPages = (page/*: RehersalPage*/)/*: RehersalPage[]*/ => [
  page,
  ...(page.children || []).flatMap(findPages)
];

export const findPageByPath = (
  path/*: string*/,
  pages/*: RehersalPage[]*/,
)/*: RehersalPage | null*/ => {
  const allPages/*: RehersalPage[]*/ = pages.flatMap(findPages);

  return allPages.find(childPage => normalizedPath(childPage.path) === normalizedPath(path)) || null;
};