scriptencoding utf-8
if exists('g:loaded_gitpatch') && g:loaded_gitpatch
  finish
endif
let g:loaded_gitpatch = 1

function s:initialize()
  command! -range GitpatchAdd <line1>,<line2>call gitpatch#add()

  nnoremap <Plug>(gitpatch-add) :GitpatchAdd
  vnoremap <Plug>(gitpatch-add) :GitpatchAdd
endfunction

augroup InitializeGitpatch
  autocmd!
  autocmd User DenopsPluginPost:gitpatch call s:initialize()
augroup END
