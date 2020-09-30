import React, { Component } from 'react';
import { ReactiveBase, SelectedFilters, ReactiveList, ResultList, MultiList} from '@appbaseio/reactivesearch';

class App extends Component {

    // url = 'https://dev.elasticapi.licenciamento.cos.ufrj.br/'
    url = 'http://localhost:9200'
    searchStream = []

    termosFuturo = "(year OR decade OR 20??) AND NOT (201? OR 200?)"

    customQuery = () => {
        return {
            "query": {
                "bool": {
                  "must": [
                    {
                      "query_string": {
                        "fields": ["sentence.english"],
                        "query": `${this.termosFuturo}`,
                        "_name": "padrao"
                      }
                    }
                  ]
                }
              }
        }
    }

    customHighlight = (props) => {
        return {
            highlight: {
                pre_tags: ['<mark>'],
                post_tags: ['</mark>'],
                fields: {
                  "sentence": {}
                }
            }
        }
    }

    render() {

        return (
           
            <ReactiveBase
              // Nome do índice
              app="futuresv2"
              // URL do Elasticsearch
              url={this.url}
            //   url='http://elastic.rappdo.com'
            
            // Altera a string padrão de busca para ter mais de 10K arquivos e desabilita input manual de datas
            transformRequest={(props) => {
                
                let body = props.body.split(`"}\n{"query"`).join(`"}\n{"highlight":{"pre_tags":["<mark>"],"post_tags":["</mark>"],"fields":{"sentence.english":{}},"number_of_fragments":0},"track_total_hits": true,"query"`)

                body = body.split('"match_all":{}').join(`"query_string":{"fields":["sentence.english"],"query":"${this.termosFuturo}"}`)

                body = body.split(',"order":{"_count":"desc"}').join('')

                body = body.split('"query":{"bool":{"must":[').join(`"query":{"bool":{"must":[{"query_string":{"fields": ["sentence.english"], "query":"${this.termosFuturo}"}},`)
                return {
                    ...props,
                    body
                }
            }}

            
            >
            
            <div className='full-search-container container'>
                
                <SelectedFilters 
                    showClearAll={true}
                    clearAllLabel="Limpar Filtros"
                />
            </div>

            <div className='results-container'>
                <div className='filters-container'>
                    <div className='filter-card'>
                        <MultiList 
                            componentId="Ano" 
                            placeholder="Selecione Ano"
                            dataField="age.keyword" 
                            title="Ano" 
                            showSearch={true}
                            innerClass={{
                                title: 'search-title',
                            }}
                            // customQuery={this.customQuery}
                            transformData={(data) => {
                                let newData = []

                                let pivot = []

                                for(let i = 0; i < data.length; i++){
                                    pivot[data[i].key] = data[i].doc_count
                                }
                                    
                                for(let i = 2010; i <= 2020; i++){
                                    newData[i] = {
                                        key: i,
                                        doc_count: pivot[i] === undefined ? 0:pivot[i]
                                    }
                                }
                                return newData
                            }}
                            react={{
                                and: ['filtroTitulo', 'results', 'DateSensor'],
                            }}
                        />
                    </div>
                    <div className='filter-card'>
                        <MultiList 
                            componentId="filtroTitulo" 
                            dataField="titulo.keyword" 
                            title="Título" 
                            placeholder="Procurar pelo título"
                            showSearch={true}
                            showCount={false}
                            showCheckbox={true}
                            filterLabel="Título"
                            
                            customQuery={this.customQuery}
                            innerClass={{
                                title: 'search-title'
                            }}
                            react={{
                                and: ['results', 'Ano'],
                            }}
                            renderItem={(label, count, isSelected) => (
                                <div style={{
                                    width: "100%"
                                }}>
                                    <span>
                                        {label.length > 14 ? label.substring(0,14)+'...':label}
                                    </span>
                                    
                                    <span style={{
                                        marginLeft: 5,
                                        color: "#9b9b9b",
                                        float: "right",
                                        
                                    }}>
                                        {count}
                                    </span>
                                </div>
                            )}
                        />
                    </div>
                    
                </div>
                
                <div className='cards-container'>
                    <ReactiveList
                        componentId="results"
                        dataField="sentence.english"
                        customQuery={this.customQuery}
                        size={10}
                        pagination={true}
                        paginationAt="both"
                        innerClass={{
                            pagination: 'pagination'
                        }}
                        react={{
                            and: [ 'Ano', 'filtroTitulo', 'DateSensor'],
                        }}
                        renderResultStats={function(stats) {
                            return <div className='status-card'>
                                Página <b>{stats.currentPage + 1}</b> de <b>{stats.numberOfPages}</b>. Foram encontrados <b>{stats.numberOfResults}</b> documentos em <b>{stats.time}</b> ms
                            </div>
                        }}

                        // Tradução dos botões
                        onData={() =>{

                            const prevButton = document.getElementsByClassName('css-9pslbi-Button e165j7gc0')
                            if(prevButton.length > 0){
                                for(let i = 0; i < prevButton.length; i++){
                                    if(prevButton[i].text === "Prev"){
                                        prevButton[i].text = "Anterior"
                                    }
                                }
                            }

                            const nextButton = document.getElementsByClassName('css-iioxla-Button e165j7gc0')
                            if(nextButton.length > 0){
                                for(let i = 0; i < nextButton.length; i++){
                                    if(nextButton[i].text === "Next"){
                                        nextButton[i].text = "Próxima"
                                    }
                                }
                            }
                                
                        }}

                        render={({ data }) => (
                            
                                <ReactiveList.ResultCardsWrapper>
                                    {data.map(item => 
                                        {
                                            const getTitle = () => {
                                                
                                              return item.title
                                                
                                            }
                                            const getContent = () => {
                                                let content

                                                if(item.highlight['sentence.english']){
                                                    content = item.highlight['sentence.english']
                                                }
                                                else{
                                                    if(item.sentence === undefined || item.sentence === null)
                                                        content = "Documento sem conteúdo"
                                                    else
                                                        content = ""
                                                        // content = `${item.content.length > 500 ? `${item.content.substring(0,500)}`:item.content} ... `
                                                }
                                                return content
                                                    
                                            }
                                            return (
                                                <div className='cards-item'>

                                                    <ResultList key={item._id}>
                                                        <ResultList.Content>
                                                            
                                                            <ResultList.Title>
                                                                <div
                                                                
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: `
                                                                        <div class='tooltip'>
                                                                        <span class='titletext'>${getTitle()}</span>
                                                                        </div>`,
                                                                    }}
                                                                />
                                                            </ResultList.Title>

                                                            <ResultList.Description>
                                                                <div
                                                                    id='content-iframe' style={{maxHeight: 80 + "px", overflowX: 'hidden'}}
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: `${getContent()}`,
                                                                    }}
                                                                />
                                                            </ResultList.Description>
                                                        </ResultList.Content>
                                                        
                                                    </ResultList>
                                                </div>
                                            )
                                        }
                                    )}
                                </ReactiveList.ResultCardsWrapper>
                        )}
                    />
                </div>
                
            </div>
            

            </ReactiveBase>
        );
    }
}

export default App;
