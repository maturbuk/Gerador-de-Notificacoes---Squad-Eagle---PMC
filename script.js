let dadosSistema = null
let modeloSelecionado = null

document.addEventListener('DOMContentLoaded', () => {
  iniciarApp()
})

async function iniciarApp() {
  try {
    const response = await fetch('data.json')
    dadosSistema = await response.json()
    popularModelos()

    document
      .getElementById('inputExpiraData')
      .addEventListener('input', atualizarPreview)
    document
      .getElementById('inputExpiraHora')
      .addEventListener('input', atualizarPreview)
  } catch (erro) {
    console.error('Erro ao carregar dados:', erro)
  }
}

function popularModelos() {
  const select = document.getElementById('selectModelo')
  select.innerHTML = '<option value="">Selecione um modelo...</option>'
  dadosSistema.templates.forEach((t) => {
    const opt = document.createElement('option')
    opt.value = t.id
    opt.textContent = t.nome
    select.appendChild(opt)
  })

  select.addEventListener('change', (e) => {
    const id = e.target.value
    modeloSelecionado = dadosSistema.templates.find((t) => t.id === id)
    const bloco = document.getElementById('infoBlock')

    if (!modeloSelecionado) {
      bloco.style.display = 'none'
      document.getElementById('previewMensagem').innerHTML =
        'Selecione um modelo para começar...'
      return
    }

    bloco.style.display = 'block'
    montarFormularioDinamico()
    atualizarPreview()
  })
}

function montarFormularioDinamico() {
  const container = document.getElementById('containerDynamicInputs')
  container.innerHTML = ''
  const tags = modeloSelecionado.conteudo.match(/\[(.*?)\]/g) || []

  tags.forEach((tag) => {
    const nomeVar = tag.replace(/[\[\]]/g, '')
    if (nomeVar === 'EXPIRA_DATA' || nomeVar === 'EXPIRA_HORA') return

    const div = document.createElement('div')
    div.className = 'campo'

    let opcoesHtml = `<option value="">Selecione...</option>`
    const lista = dadosSistema.variaveis[nomeVar]

    if (lista) {
      lista.forEach((item) => {
        const valor = typeof item === 'object' ? item.texto || item.m : item
        opcoesHtml += `<option value="${valor}">${valor}</option>`
      })
    }

    div.innerHTML = `
        <label class="rotulo-interno">
        <span class="text-label">${nomeVar} <span class="req">*</span></span>
            <select class="input-tag" data-tag="${tag}">
                ${opcoesHtml}
            </select>
        </label>
    `
    div.querySelector('select').addEventListener('change', atualizarPreview)
    container.appendChild(div)
  })
}

function limparFormulario() {
  // Limpa os inputs de data e hora
  document.getElementById('inputExpiraData').value = ''
  document.getElementById('inputExpiraHora').value = ''

  // Limpa todos os selects dinâmicos gerados no JS
  document.querySelectorAll('.input-tag').forEach((select) => {
    select.value = ''
  })

  // Chama a sua função de preview para atualizar os textos na tela
  atualizarPreview()
}

function atualizarPreview() {
  if (!modeloSelecionado) return

  let textoFinal = modeloSelecionado.conteudo
  let textoLimpo = modeloSelecionado.conteudo // Variável para o texto sem HTML
  let generoAtual = 'm'

  // 1. Detectar gênero
  const selOcorrencia = document.querySelector(
    'select[data-tag="[OCORRENCIA]"]',
  )
  if (selOcorrencia && selOcorrencia.value) {
    const item = dadosSistema.variaveis.OCORRENCIA.find(
      (o) => o.texto === selOcorrencia.value,
    )
    if (item) generoAtual = item.genero
  }

  // 2. Processar Validade
  const dVal = document.getElementById('inputExpiraData').value
  const hVal = document.getElementById('inputExpiraHora').value
  const dataDisplay = dVal ? dVal.split('-').reverse().join('/') : 'DATA'
  const horaDisplay = hVal ? hVal : 'HORA'

  // Preview com Chips
  textoFinal = textoFinal.replace(
    '[EXPIRA_DATA]',
    `<span class="${dVal ? 'chip' : 'chip vazio'}">${dataDisplay}</span>`,
  )
  textoFinal = textoFinal.replace(
    '[EXPIRA_HORA]',
    `<span class="${hVal ? 'chip' : 'chip vazio'}">${horaDisplay}</span>`,
  )

  // Texto Limpo
  textoLimpo = textoLimpo.replace('[EXPIRA_DATA]', dataDisplay)
  textoLimpo = textoLimpo.replace('[EXPIRA_HORA]', horaDisplay)

  // 3. Processar demais campos
  document.querySelectorAll('.input-tag').forEach((select) => {
    const tag = select.getAttribute('data-tag')
    const nomeVar = tag.replace(/[\[\]]/g, '')
    const valor = select.value
    let textoExibido = valor || nomeVar

    if (valor && nomeVar === 'INTENSIDADE') {
      const regra = dadosSistema.variaveis.INTENSIDADE.find(
        (i) => i.m === valor || i.f === valor,
      )
      if (regra) textoExibido = regra[generoAtual]
    }

    // Atualiza versão com Chips
    textoFinal = textoFinal.replace(
      tag,
      `<span class="${valor ? 'chip' : 'chip vazio'}">${textoExibido}</span>`,
    )

    // Atualiza versão Limpa
    textoLimpo = textoLimpo.replace(tag, valor ? textoExibido : `[${nomeVar}]`)
  })

  // Exibe nos dois lugares
  document.getElementById('previewMensagem').innerHTML = textoFinal
  document.getElementById('textoSimples').innerText = textoLimpo
}
