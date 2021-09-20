function! gitpatch#add() range
  call denops#request('gitpatch', 'applyPatch', [bufname('%'), a:firstline, a:lastline])
endfunction
