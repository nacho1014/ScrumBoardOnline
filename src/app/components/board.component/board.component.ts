import { GithubService } from './../../services/github/github.service';
import { UserService } from './../../services/database/user.service';
import { TaskService } from './../../services/database/task.service';
import { ColumnService } from './../../services/database/column.service';
import { BoardColumn } from './../../model/boardColumn';
import { Board } from './../../model/board';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { ActivatedRoute, Params } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { PostIt } from '../../model/post.it';
import { DragulaService } from '../../../../node_modules/ng2-dragula/ng2-dragula';
import { User } from './../../model/user';
import 'rxjs/add/operator/switchMap';
import { DestroySubscribers } from '../../util/unsuscribe.decorator';

@Component({
    selector: 'list',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss'],
    providers: [ColumnService, TaskService, UserService]
})
@DestroySubscribers()
export class BoardComponent implements OnInit, OnDestroy {

    public myBoard: Board;
    public createTask: string;
    public currentUser: User;
    public board: string;
    public subscribers: any = {};
    public columns: Array<String>;
    public showModal: boolean;





    constructor(public userService: UserService, public taskService: TaskService, public columnService: ColumnService,
        public dragulaService: DragulaService, public route: ActivatedRoute) {

        this.createTask = 'Añadir tarea';
        this.dragulaSubscriptions(dragulaService);
    }

    /**
     * Metodo que nos gestiona las suscripciones drag & drop de dragula
     */
    public dragulaSubscriptions(dragulaService: DragulaService) {

        this.subscribers.dragulaSubscription = dragulaService.drop.subscribe((value) => {
            this.onDropModel(value.slice(1));
        });

          dragulaService.setOptions('bag-one', {
            moves: (el, source, handle, sibling) => !el.classList.contains('dragHere')
        });

    }

    public showDialog() {
        this.showModal = true;
    }

    public closeDialog() {
        this.showModal = false;
    }


    /**
     * Metodo que nos gestiona el drop de elementos, además nos obtiene el id del postIt a mover
     * el contenedor de inicio y el contenedor de destino
     */
    public onDropModel(args) {

        let postItId: string = args[0].id;
        let fromCollection: string = args[2].id;
        let toCollection: string = args[1].id;
        this.addToAnotherBag(postItId, `${fromCollection}`, `${toCollection}`);

    }
    /**
     * Metodo que nos gestiona el cambio de columna
     */
    public addToAnotherBag(postItId: string, fromCollection: string, toCollection: string) {


        this.taskService.addToOtherBag(this.board, postItId, fromCollection, toCollection, this.currentUser.name);
    }


    /**
     * Metodo OnInit que se ejecuta al iniciar el componente
     */
    public ngOnInit() {
        this.suscribeUser();
        this.inicializateRoute();
        this.inicializateCollections();
    }



    /**
     * En este método nos desuscribiremos de los Observers 
     */
    ngOnDestroy() {

        if (!!this.dragulaService.find('bag-one')) {
            this.dragulaService.destroy('bag-one');
        }
        console.log("On destroy")

    }

    /**
     * Método en el que obtemos la información sobre el usuario actual 
     */
    public suscribeUser() {
        this.subscribers.userSubscription = this.userService.getCurrentDeveloper().subscribe((user) => {
            this.currentUser = new User(user._name, user._surname, user._email, user._uid);
        });

    }


    /**
     * Metodo que nos obtiene el id del tablero actual a traves de la url
     */
    public inicializateRoute() {
        this.subscribers.routerSubscription = this.route.params
            .switchMap((params: Params) => this.board = params['id'])
            .subscribe((board) => {
            });

    }

    /**
     * Método que nos inicializa los arrays sobre los que se basarán las columnas del tablero
     * estos se suscriben a listas observables que nos vienen desde Firebase
     * 
     */
    public inicializateCollections() {

        console.log(this.board);
        this.subscribers.subscription = this.columnService.getColumns(this.board).subscribe(
            (items) => {
                this.columns = items;

            }
        );

    }

}
