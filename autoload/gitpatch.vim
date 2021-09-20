function! gitpatch#add() range
  let l:lastline = a:lastline
  if a:firstline ==# a:lastline
    let l:lastline = line('$')
  endif
  call denops#request('gitpatch', 'applyPatch', [bufname('%'), a:firstline, l:lastline])
endfunction
