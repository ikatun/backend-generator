const regex = /Promise<.*?>/g;

export function delazify(source: string) {
  return source.replace(regex, x => x.replace('Promise<', '').replace('>', ''));
}
