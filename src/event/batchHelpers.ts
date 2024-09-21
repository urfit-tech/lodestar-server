import { EntityManager } from "typeorm"

const unique = arr => arr.filter((v, i, a) => a.indexOf(v) === i)
const getUniqueKeys = payload => unique(payload.flatMap(Object.keys))

export const generateInsertString = (payload) => {
    const keys = getUniqueKeys(payload)
    const keysString = `(${keys.join(', ')})`
    const keysToValueString = keys => obj => `(${keys.map(key => obj?.[key] ?? 'null')
        .map(val => typeof val === 'object' ? JSON.stringify(val) : val)
        .map(val => typeof val === 'number' ? val : `'${val}'`).join(', ')})`
    const valueString = payload.map(obj => keysToValueString(keys)(obj)).join(', ')
    return { keysString, valueString }
}

export const batchInsert
    = (entityManager: EntityManager) =>
        (tableName: string) =>
            (payload) =>
                async (returningColumns: Array<string>) => {
                    const { keysString, valueString } = generateInsertString(payload)
                    const returningString = returningColumns?.join?.(', ') ?? '*'
                    const queryString = `
                        INSERT INTO ${tableName} ${keysString === '()' ?
                            'DEFAULT VALUES' :
                            `${keysString} VALUES ${valueString}`}
                        RETURNING ${returningString}
                    `
                    return await entityManager.query(queryString)
                }


export const generateUpdateString
    = (payload) => Object.entries(payload).map(([key, value]) => {
        switch (typeof value) {
            case 'object': return `${key}=${JSON.stringify(value)}`
            case 'number': return `${key}=${value}`
            default: return `${key}='${value}'`
        }
    }).join(', ')


export const batchUpdate
    = (entityManager: EntityManager) =>
        (tableName: string) =>
            (ids: Array<string>) =>
                (payload) =>
                    async (returningColumns: Array<string>) => {
                        const setString = generateUpdateString(payload)
                        const returningString = returningColumns?.join?.('') ?? '*'
                        const queryString = `
                            UPDATE ${tableName} SET ${setString}
                            WHERE id = ANY($1)
                            RETURNING ${returningString}
                        `
                        return await entityManager.query(queryString, [ids])
                    }

export const generateUpsertUpdateString
    = (updateColumnNames: Array<string>) =>
        (payload) => getUniqueKeys(payload)
            .map(key => (updateColumnNames.includes(key)) ? `${key}=EXCLUDED.${key}` : undefined)
            .filter(v => v).join(', ')

export const batchUpsert =
    (entityManager: EntityManager) =>
        (tableName: string) =>
            (onConflictColumnNames: Array<string>) =>
                (updateColumnNames: Array<string>) =>
                    (payload) =>
                        async (returningColumns: Array<string>) => {
                            const { keysString, valueString } = generateInsertString(payload)
                            const setString = generateUpsertUpdateString(updateColumnNames)(payload)
                            const onConflictString = onConflictColumnNames.join(', ')
                            const returningString = returningColumns?.join?.(', ') ?? '*'
                            const queryString = `
                                INSERT INTO ${tableName} ${keysString === '()' ?
                                    'DEFAULT VALUES' :
                                    `${keysString} VALUES ${valueString}`}
                                ON CONFLICT (${onConflictString})
                                DO UPDATE SET ${setString}
                                RETURNING ${returningString}
                            `
                            console.log(88, queryString)
                            return await entityManager.query(queryString)
                        }