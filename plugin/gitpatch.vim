scriptencoding utf-8
if exists('g:loaded_gitpatch') && g:loaded_gitpatch
  finish
endif
let g:loaded_gitpatch = 1

function s:initialize()
  command! -range=% GitpatchAdd <line1>,<line2>call gitpatch#add()
  command! -range=% GitpatchRestore <line1>,<line2>call gitpatch#restore()

  nnoremap <Plug>(gitpatch-add) :GitpatchAdd<CR>
  vnoremap <Plug>(gitpatch-add) :GitpatchAdd<CR>

  nnoremap <Plug>(gitpatch-restore) :GitpatchRestore<CR>
  vnoremap <Plug>(gitpatch-restore) :GitpatchRestore<CR>
endfunction

augroup InitializeGitpatch
  autocmd!
  autocmd User DenopsPluginPost:gitpatch call timer_start(0, { _ -> s:initialize() })
augroup END
