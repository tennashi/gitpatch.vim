function! gitpatch#add() range
  call denops#request('gitpatch', 'applyPatch', [bufname('%'), a:firstline, a:lastline])
endfunction

function! gitpatch#restore() range
  let l:current_autoread = &autoread
  setlocal autoread
  call denops#request('gitpatch', 'restorePatch', [bufname('%'), a:firstline, a:lastline])
  checktime
  let &autoread = l:current_autoread
  unlet l:current_autoread
endfunction
