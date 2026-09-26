import { buildSrcdoc } from './buildSrcdoc';

describe('buildSrcdoc', () => {
  it('embeds the instance id and the learner code', () => {
    const html = buildSrcdoc('console.log("hi")', 'pg-1');
    expect(html).toContain('"pg-1"');
    expect(html).toContain('console.log("hi")');
    expect(html).toContain('saber-playground');
  });
  it('neutralizes closing script tags inside learner code', () => {
    const html = buildSrcdoc('const s = "</script><b>x</b>";', 'pg-2');
    expect(html).not.toContain('</script><b>');
    expect(html).toContain('<\\/script><b>');
  });
});
