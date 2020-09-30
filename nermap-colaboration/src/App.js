import React, { Component } from 'react';
import { ReactiveBase, DataSearch, SelectedFilters, ReactiveList, ResultList, MultiList, DateRange} from '@appbaseio/reactivesearch';
import dateFnsFormat from "date-fns/format";
import dateFnsParse from "date-fns/parse";
import { DateUtils } from "react-day-picker";


class App extends Component {

    // url = 'https://dev.elasticapi.licenciamento.cos.ufrj.br/'
    url = 'http://localhost:9200'
    searchStream = []

    customQuery = () => {
        return {
            "query": {
                "bool": {
                  "must": [
                    {
                      "query_string": {
                        "fields": ["sentence.english"],
                        "query": `year OR month OR decade`,
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
        const formatDate = (date, format, locale) => {
            return dateFnsFormat(date, format, { locale })
        }
        
        const parseDate = (str, format, locale) => {
            const dateSplit = str.split('/')
            const newDateString = `${dateSplit[2]}-${dateSplit[1]}-${dateSplit[0]}`
            const newDate = new Date(newDateString)
            newDate.setDate(newDate.getDate() + 1)

            const parsed = dateFnsParse(new Date(newDate), format, { locale });

            if (DateUtils.isDate(parsed)) {
              return parsed;
            }
            if (DateUtils.isDate(newDate)) {
                return newDate;
            }
            return undefined;
        }

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

                const termosFuturo = "(year OR decade OR 20??) AND NOT (201? OR 200?)"
                body = body.split('"match_all":{}').join(`"query_string":{"fields":["sentence.english"],"query":"${termosFuturo}"}`)
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
                            placeholder="Procurar pela Ano"
                            innerClass={{
                                title: 'search-title',
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
                        dataField="meta.title"
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
                                    if(prevButton[i].text == "Prev"){
                                        prevButton[i].text = "Anterior"
                                    }
                                }
                            }

                            const nextButton = document.getElementsByClassName('css-iioxla-Button e165j7gc0')
                            if(nextButton.length > 0){
                                for(let i = 0; i < nextButton.length; i++){
                                    if(nextButton[i].text == "Next"){
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

                                                console.log(item)
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
