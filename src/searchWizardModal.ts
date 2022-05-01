import { App, Modal, Setting } from "obsidian"
import { ESearchColumnsTypes, ESearchResultsRenderingTypes, SearchView, SEARCH_COLUMNS_DESCRIPTION, SEARCH_RESULTS_RENDERING_TYPE_DESCRIPTION } from "./searchView"
import { IJiraIssueSettings } from "./settings"


export class SearchWizardModal extends Modal {
    private _searchView: SearchView
    private _settings: IJiraIssueSettings
    private _onSubmit: (result: string) => void

    constructor(app: App, settings: IJiraIssueSettings, onSubmit: (result: string) => void) {
        super(app)
        this._settings = settings
        this._onSubmit = onSubmit
        this._searchView = new SearchView()
    }

    onOpen() {
        const { contentEl } = this
        contentEl.empty()
        contentEl.createEl("h2", { text: "Search wizard" })

        new Setting(contentEl)
            .setName('Search rendering type')
            .addDropdown(dropdown => dropdown
                .addOptions(SEARCH_RESULTS_RENDERING_TYPE_DESCRIPTION)
                .setValue(this._searchView.type)
                .onChange(async value => {
                    this._searchView.type = value as ESearchResultsRenderingTypes
                }))
        new Setting(contentEl)
            .setName('Jira query')
            .addTextArea(textArea => textArea
                .setValue(this._searchView.query)
                .onChange(async value => {
                    this._searchView.query = value
                }))
        new Setting(contentEl)
            .setName('Search results limit')
            .addText(text => text
                .setPlaceholder(`Use default value: ${this._settings.searchResultsLimit}`)
                .setValue(this._searchView.limit)
                .onChange(async value => {
                    this._searchView.limit = value ? (parseInt(value).toString() || '') : ''
                }))

        const desc = document.createDocumentFragment()
        desc.createEl('h2', { text: 'Columns' })
        desc.appendText('Keep the list empty to use the default columns')
        new Setting(contentEl).setDesc(desc)
        this._searchView.columns.forEach((column, index) => {
            const setting = new Setting(contentEl)
                .addDropdown(dropdown => dropdown
                    .addOptions(SEARCH_COLUMNS_DESCRIPTION)
                    .setValue(column.type)
                    .onChange(async value => {
                        this._searchView.columns[index].type = value as ESearchColumnsTypes
                        // Force refresh
                        this.open()
                    }).selectEl.addClass('flex-grow-1')
                )

            // if (column.type === ESearchColumnsTypes.CUSTOM) {
            //     setting.addText(text => text
            //         .setPlaceholder('Custom field name')
            //         .setValue(column.customField)
            //         .onChange(async value => {
            //             this._data.columns[index].customField = value

            //         }).inputEl.addClass('custom-field-text')
            //     )
            // }
            setting.addExtraButton(button => button
                .setIcon(this._searchView.columns[index].compact ? 'compress-glyph' : 'enlarge-glyph')
                .setTooltip(this._searchView.columns[index].compact ? 'Compact' : 'Full width')
                .onClick(async () => {
                    this._searchView.columns[index].compact = !this._searchView.columns[index].compact
                    // Force refresh
                    this.open()
                }))
            setting.addExtraButton(button => button
                .setIcon('up-chevron-glyph')
                .setTooltip('Move up')
                .setDisabled(index === 0)
                .onClick(async () => {
                    const tmp = this._searchView.columns[index]
                    this._searchView.columns[index] = this._searchView.columns[index - 1]
                    this._searchView.columns[index - 1] = tmp
                    // Force refresh
                    this.open()
                }))
            setting.addExtraButton(button => button
                .setIcon('down-chevron-glyph')
                .setTooltip('Move down')
                .setDisabled(index === this._searchView.columns.length - 1)
                .onClick(async () => {
                    const tmp = this._searchView.columns[index]
                    this._searchView.columns[index] = this._searchView.columns[index + 1]
                    this._searchView.columns[index + 1] = tmp
                    // Force refresh
                    this.open()
                }))
            setting.addExtraButton(button => button
                .setIcon('trash')
                .setTooltip('Delete')
                .onClick(async () => {
                    this._searchView.columns.splice(index, 1)
                    // Force refresh
                    this.open()
                }))
            setting.infoEl.remove()
        })
        const searchColumnsButtons = new Setting(contentEl)
        searchColumnsButtons.addButton(button => button
            .setButtonText("Add Column")
            .setCta()
            .onClick(async value => {
                this._searchView.columns.push({ type: ESearchColumnsTypes.STATUS, compact: false })
                // Force refresh
                this.open()
            })
        )
        searchColumnsButtons.addButton(button => button
            .setButtonText("Reset to default columns")
            .setWarning()
            .onClick(async value => {
                this._searchView.columns = []
                // Force refresh
                this.open()
            })
        )
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText("Insert")
                .setCta()
                .onClick(() => {
                    this.close()
                    this._onSubmit(this._searchView.toString())
                }))
    }

    onClose() {
        this.contentEl.empty()
    }
}
