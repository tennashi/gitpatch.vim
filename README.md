# gitpatch.vim
Add the selected range to the index.

Powered by [denops.vim](https://github.com/vim-denops/denops.vim)

## Install
* [vim-plug](https://github.com/junegunn/vim-plug)

```vim
Plug 'vim-denops/denops.vim'
Plug 'tennashi/gitpatch.vim'
```

* [dein.vim](https://github.com/Shougo/dein.vim)

```vim
call dein#add('vim-denops/denops.vim')
call dein#add('tennashi/gitpatch.vim')
```

* [volt](https://github.com/vim-volt/volt)

```bash
$ volt get vim-denops/denops.vim
$ volt get tennashi/gitpatch.vim
```

## Commands
| Command | Description |
| ------- | ----------- |
| `:GitpatchAdd` | Add the selected range to the index.  If you do not select a range, the entire file will be added to the index. |

Restriction: Apply only to hunk that is completely contained in the selected range.
             I'm still considering how to apply hunk, which is only partially included.

## License
MIT
