const raw = String.raw`
                              ███
                            ███
                           ███              ████
                         ████               ██ ██████████
                       █████              ███           ███
                    ████ ██            █████            ███
                  ███   ███       █████████           ███
                ████    ██   ███████  ███          ████
            █ ███     ████████      ████        ████
            █████████████           ███     █████
         ████          █           ██████████
       ███             █         ███  ███
    ████               ██      ████
                         ████████
                             ███
                            ███
                           ███
                          ███
                        ████
                       ███
                      ███
                     ███
                    ███
                   ██
`.replace(/^\n/, '').replace(/\n$/, '').split('\n');

const PAD = 2;
const innerWidth = Math.max(...raw.map((l) => l.length)) + PAD * 2;
const pad = ' '.repeat(PAD);

const top = '┌' + '─'.repeat(innerWidth) + '┐';
const bottom = '└' + '─'.repeat(innerWidth) + '┘';
const body = raw.map((line) => '│' + pad + line.padEnd(innerWidth - PAD, ' ') + '│');

export const signature = [top, ...body, bottom];
